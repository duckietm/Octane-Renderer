import { ICodec, IConnection, IConnectionStateSnapshot, IMessageComposer, IMessageConfiguration, IMessageDataWrapper, IMessageEvent, IMessageParser, WebSocketEventEnum } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher, OctaneEvent, OctaneEventType, ReconnectEvent } from '@octane/events';
import { OctaneLogger } from '@octane/utils';
import { EvaWireFormat } from './codec';
import { aesGcmDecrypt, aesGcmEncrypt, buildClientHello, deriveAesKey, deriveSharedSecret, exportPublicKeySpki, generateEphemeralKeyPair, importPublicKeySpki, importSigningPublicKeyFromBase64, NONCE_LEN, parseServerHello, randomNonce, verifyEphemeralSignature } from './crypto';
import { ConnectionStateStore } from './ConnectionStateStore';
import { MessageClassManager } from './messages';
import { shouldReconnectAfterClose } from './socketClosePolicy';

type CryptoState = 'disabled' | 'awaiting_server_hello' | 'ready' | 'error';

export class SocketConnection implements IConnection
{
    private _socket: WebSocket = null;
    private _messages: MessageClassManager = new MessageClassManager();
    private _codec: ICodec = new EvaWireFormat();
    private _dataBuffer: ArrayBuffer = null;
    private _pendingChunks: Uint8Array[] = [];
    private _pendingBytes: number = 0;
    private _isReady: boolean = false;
    private _pendingClientMessages: IMessageComposer<unknown[]>[] = [];
    private _pendingServerMessages: IMessageDataWrapper[] = [];
    private _isAuthenticated: boolean = false;
    private _onOpenCallback: (event: Event) => void = null;
    private _onCloseCallback: (event: Event) => void = null;
    private _onErrorCallback: (event: Event) => void = null;
    private _onMessageCallback: (event: MessageEvent) => void = null;
    private _socketUrl: string = null;
    private _reconnectAttempt: number = 0;
    private _reconnectTimer: ReturnType<typeof setTimeout> = null;
    private _isReconnecting: boolean = false;
    private _intentionalClose: boolean = false;
    private _wasAuthenticated: boolean = false;

    public static readonly MAX_RECONNECT_ATTEMPTS: number = 7;
    public static readonly BASE_RECONNECT_DELAY_MS: number = 1000;
    public static readonly MAX_RECONNECT_DELAY_MS: number = 30000;

    private readonly _connectionState = new ConnectionStateStore(SocketConnection.MAX_RECONNECT_ATTEMPTS);

    private _cryptoState: CryptoState = 'disabled';
    private _sessionKey: CryptoKey = null;
    private _pendingEncryptedSends: ArrayBuffer[] = [];
    private _decryptChain: Promise<void> = Promise.resolve();

    public init(socketUrl: string): void
    {
        if(!socketUrl || !socketUrl.length) return;

        this._socketUrl = socketUrl;
        this._intentionalClose = false;

        this.setConnectionState({
            phase: 'connecting',
            reconnectAttempt: 0,
            authenticated: false,
            closeCode: null,
            closeReason: ''
        });

        this.createSocket(socketUrl);
    }

    private createSocket(socketUrl: string): void
    {
        this._dataBuffer = new ArrayBuffer(0);
        this._pendingChunks = [];
        this._pendingBytes = 0;
        this._decryptChain = Promise.resolve();
        const cryptoEnabled = !!GetConfiguration().getValue<boolean>('crypto.ws.enabled', false);
        if(cryptoEnabled && !this.subtleCryptoAvailable())
        {
            OctaneLogger.error('[ws-crypto] crypto.ws.enabled=true but window.crypto.subtle is unavailable. '
                + 'This page must be served from a secure context - HTTPS, localhost, or 127.0.0.1. '
                + 'Current origin: ' + (typeof window !== 'undefined' ? window.location.origin : 'unknown'));
            this._cryptoState = 'error';
        }
        else
        {
            this._cryptoState = cryptoEnabled ? 'awaiting_server_hello' : 'disabled';
        }
        this._sessionKey = null;
        this._pendingEncryptedSends = [];

        this._socket = new WebSocket(socketUrl);
        this._socket.binaryType = 'arraybuffer';
        this._onOpenCallback = () => this.onSocketOpened();
        this._onCloseCallback = (event: Event) => this.onSocketClosed(event as CloseEvent);
        this._onErrorCallback = () => this.onSocketError();
        this._onMessageCallback = (event: MessageEvent) => this.onSocketMessage(event.data as ArrayBuffer);
        this._socket.addEventListener(WebSocketEventEnum.CONNECTION_OPENED, this._onOpenCallback);
        this._socket.addEventListener(WebSocketEventEnum.CONNECTION_CLOSED, this._onCloseCallback);
        this._socket.addEventListener(WebSocketEventEnum.CONNECTION_ERROR, this._onErrorCallback);
        this._socket.addEventListener(WebSocketEventEnum.CONNECTION_MESSAGE, this._onMessageCallback);
    }

    private subtleCryptoAvailable(): boolean
    {
        return typeof window !== 'undefined'
            && typeof window.crypto !== 'undefined'
            && typeof window.crypto.subtle !== 'undefined';
    }

    private onSocketMessage(data: ArrayBuffer): void
    {
        if(this._cryptoState === 'error')
        {
            this._intentionalClose = true;
            if(this._socket) this._socket.close();
            return;
        }

        if(this._cryptoState === 'awaiting_server_hello')
        {
            this.handleServerHello(data)
                .catch(err =>
                {
                    OctaneLogger.error('[ws-crypto] handshake failed', err);
                    this._cryptoState = 'error';
                    this._intentionalClose = true;
                    if(this._socket) this._socket.close();
                });
            return;
        }

        if(this._cryptoState === 'ready')
        {
            const frame = data;

            this._decryptChain = this._decryptChain.then(async () =>
            {
                if((this._cryptoState !== 'ready') || this._intentionalClose) return;

                try
                {
                    const plain = await this.decryptFrame(frame);

                    this.enqueueAndProcess(plain);
                }
                catch (err)
                {
                    OctaneLogger.error('[ws-crypto] decrypt failed', err);
                    this._cryptoState = 'error';
                    this._intentionalClose = true;
                    if(this._socket) this._socket.close();
                }
            });
            return;
        }

        this.enqueueAndProcess(data);
    }

    private enqueueAndProcess(data: ArrayBuffer): void
    {
        if(data && data.byteLength)
        {
            this._pendingChunks.push(new Uint8Array(data));
            this._pendingBytes += data.byteLength;
        }

        if(this._pendingBytes < 4) return;

        const messageLength = this.peekFirstMessageLength();

        if(messageLength < 0 || (this._pendingBytes < (messageLength + 4))) return;

        this._dataBuffer = this.mergePendingChunks();
        this._pendingChunks = [];
        this._pendingBytes = 0;

        this.processReceivedData();

        const remainder = this._dataBuffer;
        this._dataBuffer = new ArrayBuffer(0);

        if(remainder && remainder.byteLength)
        {
            this._pendingChunks.push(new Uint8Array(remainder));
            this._pendingBytes = remainder.byteLength;
        }
    }

    private peekFirstMessageLength(): number
    {
        let value = 0;
        let read = 0;

        for(const chunk of this._pendingChunks)
        {
            for(let i = 0; (i < chunk.byteLength) && (read < 4); i++)
            {
                value = ((value << 8) | chunk[i]) >>> 0;
                read++;
            }

            if(read >= 4) break;
        }

        if(read < 4) return -1;

        return value | 0;
    }

    private mergePendingChunks(): ArrayBuffer
    {
        if(!this._pendingChunks.length) return new ArrayBuffer(0);

        if(this._pendingChunks.length === 1)
        {
            const only = this._pendingChunks[0];

            if((only.byteOffset === 0) && (only.byteLength === only.buffer.byteLength)) return only.buffer as ArrayBuffer;

            return only.buffer.slice(only.byteOffset, only.byteOffset + only.byteLength) as ArrayBuffer;
        }

        const merged = new Uint8Array(this._pendingBytes);
        let offset = 0;

        for(const chunk of this._pendingChunks)
        {
            merged.set(chunk, offset);
            offset += chunk.byteLength;
        }

        return merged.buffer;
    }

    private async handleServerHello(frame: ArrayBuffer): Promise<void>
    {
        const { pubkeySpki: serverPubkeySpki, signature } = parseServerHello(frame);
        const signingRequired = !!GetConfiguration().getValue<boolean>('crypto.ws.signing.enabled', false);
        if(signingRequired)
        {
            if(!signature) throw new Error('crypto.ws.signing.enabled=true but server_hello had no signature');

            const signingPub = await this.getSigningPublicKey();
            const ok = await verifyEphemeralSignature(signingPub, signature, serverPubkeySpki);
            if(!ok) throw new Error('server_hello signature verification failed (MITM?)');
        }

        const serverPubkey = await importPublicKeySpki(serverPubkeySpki);
        const ourKeys = await generateEphemeralKeyPair();
        const ourPubkeySpki = await exportPublicKeySpki(ourKeys.publicKey);
        const shared = await deriveSharedSecret(ourKeys.privateKey, serverPubkey);
        this._sessionKey = await deriveAesKey(shared);
        this._socket.send(buildClientHello(ourPubkeySpki));
        this._cryptoState = 'ready';

        if(this._pendingEncryptedSends.length)
        {
            const queued = this._pendingEncryptedSends;
            this._pendingEncryptedSends = [];
            for(const buf of queued) await this.encryptAndSend(buf);
        }
    }

    private _cachedSigningPublicKey: CryptoKey = null;
    private async getSigningPublicKey(): Promise<CryptoKey>
    {
        if(this._cachedSigningPublicKey) return this._cachedSigningPublicKey;

        const pinned = GetConfiguration().getValue<string>('crypto.ws.signing.public_key', '');
        if(pinned)
        {
            this._cachedSigningPublicKey = await importSigningPublicKeyFromBase64(pinned);
            return this._cachedSigningPublicKey;
        }

        const endpointTemplate = GetConfiguration().getValue<string>('login.server_key.endpoint', '/api/auth/server-key');
        const endpoint = GetConfiguration().interpolate(endpointTemplate);
        const resp = await fetch(endpoint, { credentials: 'include' });
        if(!resp.ok) throw new Error(`server-key fetch failed: HTTP ${ resp.status }`);
        const payload = await resp.json();
        const b64 = typeof payload?.publicKey === 'string' ? payload.publicKey : '';
        if(!b64) throw new Error('server-key response missing publicKey');
        this._cachedSigningPublicKey = await importSigningPublicKeyFromBase64(b64);
        return this._cachedSigningPublicKey;
    }

    private async decryptFrame(frame: ArrayBuffer): Promise<ArrayBuffer>
    {
        if(frame.byteLength < NONCE_LEN + 16) throw new Error('encrypted frame too short');
        const nonce = new Uint8Array(frame, 0, NONCE_LEN);
        const ct = frame.slice(NONCE_LEN);
        return aesGcmDecrypt(this._sessionKey, nonce, ct);
    }

    private async encryptAndSend(plaintext: ArrayBuffer): Promise<void>
    {
        if(!this._sessionKey) return;
        const nonce = randomNonce();
        const ct = await aesGcmEncrypt(this._sessionKey, nonce, plaintext);
        const framed = new Uint8Array(NONCE_LEN + ct.byteLength);
        framed.set(nonce, 0);
        framed.set(new Uint8Array(ct), NONCE_LEN);
        if(this._socket && this._socket.readyState === WebSocket.OPEN) this._socket.send(framed.buffer);
    }

    private onSocketOpened(): void
    {
        if(this._isReconnecting)
        {
            this._reconnectAttempt = 0;
            this._isReconnecting = false;

            this.setConnectionState({ phase: 'reauthenticating', reconnectAttempt: 0, authenticated: false });

            GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.SOCKET_RECONNECTED));
        }
        else
        {
            this.setConnectionState({ phase: 'authenticating', authenticated: false });
            GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.SOCKET_OPENED));
        }
    }

    private onSocketClosed(event: CloseEvent): void
    {
        OctaneLogger.log('[SocketConnection] Socket closed, code: ' + (event?.code ?? 'unknown') + ', reason: ' + (event?.reason || 'none'));

        const code = event?.code ?? 0;
        const closeReason = event?.reason || '';
        const hadAuthenticatedSession = this._isAuthenticated || this._wasAuthenticated;

        if(!shouldReconnectAfterClose(code, this._intentionalClose))
        {
            this._isAuthenticated = false;
            this._isReady = false;

            this.setConnectionState({
                phase: (!this._intentionalClose && hadAuthenticatedSession) ? 'failed' : 'disconnected',
                authenticated: false,
                closeCode: code,
                closeReason
            });

            GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.SOCKET_CLOSED));
            return;
        }

        if(this._isAuthenticated) this._wasAuthenticated = true;

        this._isAuthenticated = false;
        this._isReady = false;
        this._pendingClientMessages = [];
        this._pendingServerMessages = [];

        this.setConnectionState({
            phase: 'reconnecting',
            authenticated: false,
            closeCode: code,
            closeReason
        });

        this.attemptReconnect();
    }

    private onSocketError(): void
    {
        if(this._isReconnecting)
        {
            return;
        }

        if(!this._wasAuthenticated && !this._isAuthenticated)
        {
            GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.SOCKET_ERROR));
        }
    }

    private attemptReconnect(): void
    {
        if(this._reconnectAttempt >= SocketConnection.MAX_RECONNECT_ATTEMPTS)
        {
            this._isReconnecting = false;
            this._wasAuthenticated = false;

            this.setConnectionState({
                phase: 'failed',
                reconnectAttempt: this._reconnectAttempt,
                authenticated: false
            });

            GetEventDispatcher().dispatchEvent(new ReconnectEvent(
                OctaneEventType.SOCKET_RECONNECT_FAILED,
                this._reconnectAttempt,
                SocketConnection.MAX_RECONNECT_ATTEMPTS
            ));

            GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.SOCKET_CLOSED));

            return;
        }

        this._isReconnecting = true;
        this._reconnectAttempt++;

        this.setConnectionState({
            phase: 'reconnecting',
            reconnectAttempt: this._reconnectAttempt,
            authenticated: false
        });

        const delay = Math.min(
            SocketConnection.BASE_RECONNECT_DELAY_MS * Math.pow(2, this._reconnectAttempt - 1) + Math.random() * 1000,
            SocketConnection.MAX_RECONNECT_DELAY_MS
        );

        GetEventDispatcher().dispatchEvent(new ReconnectEvent(
            OctaneEventType.SOCKET_RECONNECTING,
            this._reconnectAttempt,
            SocketConnection.MAX_RECONNECT_ATTEMPTS
        ));

        this._reconnectTimer = setTimeout(() =>
        {
            this._reconnectTimer = null;

            this.cleanupSocket();

            this.createSocket(this._socketUrl);
        }, delay);
    }

    private cleanupSocket(): void
    {
        if(!this._socket) return;

        if(this._onOpenCallback) this._socket.removeEventListener(WebSocketEventEnum.CONNECTION_OPENED, this._onOpenCallback);
        if(this._onCloseCallback) this._socket.removeEventListener(WebSocketEventEnum.CONNECTION_CLOSED, this._onCloseCallback);
        if(this._onErrorCallback) this._socket.removeEventListener(WebSocketEventEnum.CONNECTION_ERROR, this._onErrorCallback);
        if(this._onMessageCallback) this._socket.removeEventListener(WebSocketEventEnum.CONNECTION_MESSAGE, this._onMessageCallback);

        if(this._socket.readyState === WebSocket.OPEN || this._socket.readyState === WebSocket.CONNECTING)
        {
            try
            {
                this._socket.close();
            }
            catch (e)
            {}
        }

        this._socket = null;
        this._onOpenCallback = null;
        this._onCloseCallback = null;
        this._onErrorCallback = null;
        this._onMessageCallback = null;
    }

    public dispose(): void
    {
        this._intentionalClose = true;

        if(this._reconnectTimer)
        {
            clearTimeout(this._reconnectTimer);
            this._reconnectTimer = null;
        }

        this._isReconnecting = false;
        this._reconnectAttempt = 0;
        this._wasAuthenticated = false;

        this.cleanupSocket();

        this._pendingClientMessages = [];
        this._pendingServerMessages = [];
        this._pendingChunks = [];
        this._pendingBytes = 0;
        this._dataBuffer = null;
        this._decryptChain = Promise.resolve();

        this.setConnectionState({
            phase: 'disconnected',
            reconnectAttempt: 0,
            authenticated: false,
            closeCode: null,
            closeReason: ''
        });
    }

    public ready(): void
    {
        if(this._isReady) return;

        this._isReady = true;

        if(this._pendingServerMessages && this._pendingServerMessages.length) this.processWrappers(...this._pendingServerMessages);

        if(this._pendingClientMessages && this._pendingClientMessages.length) this.send(...this._pendingClientMessages);

        this._pendingServerMessages = [];
        this._pendingClientMessages = [];
    }

    public authenticated(): void
    {
        this._isAuthenticated = true;
        this.setConnectionState({
            phase: 'connected',
            reconnectAttempt: 0,
            authenticated: true,
            closeCode: null,
            closeReason: ''
        });
    }

    private setConnectionState(patch: Partial<IConnectionStateSnapshot>): void
    {
        if(!this._connectionState.update(patch)) return;

        GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.CONNECTION_STATE_CHANGED));
    }

    public send(...composers: IMessageComposer<unknown[]>[]): boolean
    {
        if(!composers) return false;

        composers = [...composers];

        if(this._isAuthenticated && !this._isReady)
        {
            this._pendingClientMessages.push(...composers);

            return false;
        }

        for(const composer of composers)
        {
            if(!composer) continue;

            const header = this._messages.getComposerId(composer);

            if(header === -1)
            {
                OctaneLogger.packets('Unknown Composer', composer.constructor.name);

                continue;
            }

            const message = composer.getMessageArray();
            const encoded = this._codec.encode(header, message);

            if(!encoded)
            {
                OctaneLogger.packets('Encoding Failed', composer.constructor.name);

                continue;
            }

            OctaneLogger.packets('OutgoingComposer', header, composer.constructor.name, message);

            this.write(encoded.getBuffer());
        }

        return true;
    }

    private write(buffer: ArrayBuffer): void
    {
        if(!this._socket || this._socket.readyState !== WebSocket.OPEN) return;

        if(this._cryptoState === 'disabled')
        {
            this._socket.send(buffer);
            return;
        }

        if(this._cryptoState === 'ready')
        {
            this.encryptAndSend(buffer).catch(err => OctaneLogger.error('[ws-crypto] encrypt failed', err));
            return;
        }

        if(this._cryptoState === 'awaiting_server_hello')
        {
            this._pendingEncryptedSends.push(buffer);
            return;
        }
    }

    public processReceivedData(): void
    {
        try
        {
            this.processData();
        }

        catch (err)
        {
            OctaneLogger.error(err);
        }
    }

    private processData(): void
    {
        const wrappers = this.splitReceivedMessages();

        if(!wrappers || !wrappers.length) return;

        if(this._isAuthenticated && !this._isReady)
        {
            if(!this._pendingServerMessages) this._pendingServerMessages = [];

            this._pendingServerMessages.push(...wrappers);

            return;
        }

        this.processWrappers(...wrappers);
    }

    private processWrappers(...wrappers: IMessageDataWrapper[]): void
    {
        if(!wrappers || !wrappers.length) return;

        for(const wrapper of wrappers)
        {
            if(!wrapper) continue;

            const messages = this.getMessagesForWrapper(wrapper);

            if(!messages || !messages.length) continue;

            OctaneLogger.packets('IncomingMessage', wrapper.header, messages[0].constructor.name, messages[0].parser);

            this.handleMessages(...messages);
        }
    }

    private splitReceivedMessages(): IMessageDataWrapper[]
    {
        if(!this._dataBuffer || !this._dataBuffer.byteLength) return null;

        return this._codec.decode(this);
    }

    private getMessagesForWrapper(wrapper: IMessageDataWrapper): IMessageEvent[]
    {
        if(!wrapper) return null;

        const events = this._messages.getEvents(wrapper.header);

        if(!events || !events.length)
        {
            OctaneLogger.packets('IncomingMessage', wrapper.header, 'UNREGISTERED', wrapper);

            return null;
        }

        try
        {
            const parser = new (events[0].parserClass as new () => IMessageParser)();

            if(!parser || !parser.flush() || !parser.parse(wrapper)) return null;

            for(const event of events) (event.parser = parser);
        }

        catch (e)
        {
            OctaneLogger.error('Error parsing message', e, events[0].constructor.name);

            return null;
        }

        return events;
    }

    private handleMessages(...messages: IMessageEvent[]): void
    {
        messages = [...messages];

        for(const message of messages)
        {
            if(!message) continue;

            message.connection = this;

            if(message.callBack) message.callBack(message);
        }
    }

    public registerMessages(configuration: IMessageConfiguration): void
    {
        if(!configuration) return;

        this._messages.registerMessages(configuration);
    }

    public addMessageEvent(event: IMessageEvent): void
    {
        if(!event || !this._messages) return;

        this._messages.registerMessageEvent(event);
    }

    public removeMessageEvent(event: IMessageEvent): void
    {
        if(!event || !this._messages) return;

        this._messages.removeMessageEvent(event);
    }

    public get isAuthenticated(): boolean
    {
        return this._isAuthenticated;
    }

    public get connectionState(): Readonly<IConnectionStateSnapshot>
    {
        return this._connectionState.snapshot;
    }

    public get isReconnecting(): boolean
    {
        return this._isReconnecting;
    }

    public get wasAuthenticated(): boolean
    {
        return this._wasAuthenticated;
    }

    public get dataBuffer(): ArrayBuffer
    {
        return this._dataBuffer;
    }

    public set dataBuffer(buffer: ArrayBuffer)
    {
        this._dataBuffer = buffer;
    }
}
