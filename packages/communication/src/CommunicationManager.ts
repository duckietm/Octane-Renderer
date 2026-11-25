import { ICommunicationManager, IConnection, IMessageConfiguration, IMessageEvent } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher, OctaneEventType, SocketReauthenticatedEvent } from '@octane/events';
import { GetTickerTime, OctaneLogger } from '@octane/utils';
import { OctaneMessages } from './OctaneMessages';
import { SocketConnection } from './SocketConnection';
import { AuthenticatedEvent, ClientHelloMessageComposer, ClientPingEvent, DisconnectReasonEvent, InfoRetrieveMessageComposer, PongMessageComposer, SSOTicketMessageComposer, UniqueIDMessageComposer } from './messages';

/** Where the last computed machine fingerprint is kept, so the next login need not wait for a new one. */
export const MACHINE_ID_STORAGE_KEY = 'octane.machineId';
const MACHINE_ID_PATTERN = /^IID-[A-Za-z0-9_-]{8,128}$/;

export class CommunicationManager implements ICommunicationManager
{
    private _connection: IConnection = new SocketConnection();
    private _messages: IMessageConfiguration = new OctaneMessages();

    private _pongInterval: any = null;
    private _messageEvents: IMessageEvent[] = [];
    private _socketClosedCallback: () => void = null;
    private _socketOpenedCallback: () => void = null;
    private _socketErrorCallback: () => void = null;
    private _socketReconnectedCallback: () => void = null;

    private _machineIdPromise: Promise<string> | null = null;
    // The remembered fingerprint sent at login; checked against a fresh one once the client is idle.
    private _sentCachedMachineId: string | null = null;
    private _machineIdVerifyTimer: ReturnType<typeof setTimeout> | null = null;
    private _machineIdVerifyIdle: number | null = null;
    private _initResolved: boolean = false;
    private _listenersRegistered: boolean = false;
    private _connectionStarted: boolean = false;
    private _initAttempt: { resolve: () => void; reject: (error: Error) => void } = null;
    private _recoveryToken: string = '';

    private readCachedMachineID(): string | null
    {
        try
        {
            const cached = globalThis.localStorage?.getItem(MACHINE_ID_STORAGE_KEY);

            return (cached && MACHINE_ID_PATTERN.test(cached)) ? cached : null;
        }
        catch
        {
            return null;
        }
    }

    /** Fingerprints this browser (the library loads only when needed) and remembers the result for the next login. */
    protected async computeFreshMachineID(): Promise<string>
    {
        try
        {
            const { Thumbmark } = await import('@thumbmarkjs/thumbmarkjs');
            const result = await new Thumbmark().get();

            if(!result.thumbmark) return 'FAILED';

            const machineId = `IID-${result.thumbmark}`;

            try
            {
                globalThis.localStorage?.setItem(MACHINE_ID_STORAGE_KEY, machineId);
            }
            catch
            {
                // Storage full or blocked: the next login computes it again.
            }

            return machineId;
        }
        catch (error)
        {
            OctaneLogger.warn('[CommunicationManager] Failed to generate machine ID', error);

            return 'FAILED';
        }
    }

    /**
     * The fingerprint sent with the login. A remembered one is used at once, as computing it takes a while;
     * it is checked after the login (scheduleMachineIDVerification), so an outdated or edited one is corrected.
     */
    private async generateMachineID(): Promise<string>
    {
        const cached = this.readCachedMachineID();

        this._sentCachedMachineId = cached;

        return cached ?? this.computeFreshMachineID();
    }

    private cancelMachineIDVerification(): void
    {
        if(this._machineIdVerifyTimer !== null)
        {
            clearTimeout(this._machineIdVerifyTimer);
            this._machineIdVerifyTimer = null;
        }

        if(this._machineIdVerifyIdle !== null)
        {
            (globalThis as { cancelIdleCallback?: (id: number) => void }).cancelIdleCallback?.(this._machineIdVerifyIdle);
            this._machineIdVerifyIdle = null;
        }
    }

    /**
     * After a login made with the remembered fingerprint, computes the real one when the browser is idle and
     * sends it if it differs; the server accepts the UniqueID message after the login and checks bans on it.
     */
    private scheduleMachineIDVerification(): void
    {
        const sentCached = this._sentCachedMachineId;

        if(!sentCached) return;

        this._sentCachedMachineId = null;
        this.cancelMachineIDVerification();

        const runVerification = () =>
        {
            this._machineIdVerifyTimer = null;
            this._machineIdVerifyIdle = null;

            void this.computeFreshMachineID().then(freshId =>
            {
                if(!freshId || (freshId === 'FAILED') || (freshId === sentCached)) return;

                // Reconnects send the corrected one from now on.
                this._machineIdPromise = Promise.resolve(freshId);
                this._connection?.send(new UniqueIDMessageComposer(freshId, '', ''));
            });
        };

        const requestIdle = (globalThis as { requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number }).requestIdleCallback;

        if(typeof requestIdle === 'function') this._machineIdVerifyIdle = requestIdle.call(globalThis, runVerification, { timeout: 5000 });
        else this._machineIdVerifyTimer = setTimeout(runVerification, 2500);
    }

    private async sendHandshake(): Promise<void>
    {
        if(this._machineIdPromise === null) this._machineIdPromise = this.generateMachineID();

        const machineId = await this._machineIdPromise;

        this._connection.send(new ClientHelloMessageComposer(null, null, null, null));
        // Send the machine fingerprint (UniqueID) BEFORE the SSO ticket so the server
        // has the machineId available when it processes the login in Habbo.connect().
        this._connection.send(new UniqueIDMessageComposer(machineId, '', ''));
        this._connection.send(new SSOTicketMessageComposer(
            GetConfiguration().getValue('sso.ticket', null),
            GetTickerTime(),
            this._recoveryToken));
    }

    constructor()
    {
        this._connection.registerMessages(this._messages);
    }

    /**
     * Connects and logs in; resolves on the first AuthenticationOK. Once logged in, later calls resolve at
     * once. A call while an earlier attempt never logged in (a refused ticket, a dead socket) closes that
     * attempt and starts a fresh login, so a second login from the login screen works.
     */
    public init(): Promise<void>
    {
        if(this._initResolved && this._connection.isAuthenticated) return Promise.resolve();

        // Started before the socket opens, so the handshake rarely waits for it.
        if(this._machineIdPromise === null) this._machineIdPromise = this.generateMachineID();

        this.registerListeners();

        if(this._initAttempt)
        {
            const previous = this._initAttempt;

            this._initAttempt = null;
            previous.reject(new Error('Replaced by a new connection attempt'));
        }

        if(this._connectionStarted)
        {
            this.stopPong();
            this._connection.dispose();
            this._initResolved = false;
            this._recoveryToken = '';
        }

        return new Promise((resolve, reject) =>
        {
            this._initAttempt = { resolve, reject };
            this._connectionStarted = true;

            this._connection.init(GetConfiguration().getValue<string>('socket.url'));
        });
    }

    private registerListeners(): void
    {
        if(this._listenersRegistered) return;

        this._listenersRegistered = true;

        this._socketClosedCallback = () =>
        {
            this.stopPong();
        };
        GetEventDispatcher().addEventListener(OctaneEventType.SOCKET_CLOSED, this._socketClosedCallback);

        // Handle reconnection - re-authenticate when socket reconnects
        this._socketReconnectedCallback = () =>
        {
            OctaneLogger.log('[CommunicationManager] Socket reconnected, re-authenticating...');

            if(GetConfiguration().getValue<boolean>('system.pong.manually', false)) this.startPong();

            void this.sendHandshake();
        };
        GetEventDispatcher().addEventListener(OctaneEventType.SOCKET_RECONNECTED, this._socketReconnectedCallback);

        this._socketOpenedCallback = () =>
        {
            if(GetConfiguration().getValue<boolean>('system.pong.manually', false)) this.startPong();

            void this.sendHandshake();
        };
        GetEventDispatcher().addEventListener(OctaneEventType.SOCKET_OPENED, this._socketOpenedCallback);

        this._socketErrorCallback = () =>
        {
            if(this._initResolved || !this._initAttempt) return;

            const attempt = this._initAttempt;

            this._initAttempt = null;
            attempt.reject(new Error('Socket error before init resolved'));
        };
        GetEventDispatcher().addEventListener(OctaneEventType.SOCKET_ERROR, this._socketErrorCallback);

        const pingEvent = new ClientPingEvent((event: ClientPingEvent) => this.sendPong());
        const authEvent = new AuthenticatedEvent((event: AuthenticatedEvent) =>
        {
            const isReconnect = this._initResolved;
            const parser = event.getParser();

            this._recoveryToken = parser.recoveryToken;

            OctaneLogger.log('[CommunicationManager] AuthenticatedEvent received (isReconnect=' + isReconnect + ')');

            this._connection.authenticated();

            if(!this._initResolved)
            {
                this._initResolved = true;

                const attempt = this._initAttempt;

                this._initAttempt = null;
                attempt?.resolve();
            }

            // A reconnect while the hotel is still loading must keep holding messages until the
            // client registered its handlers and released them itself.
            if(isReconnect && this._connection.hasBeenReady)
            {
                this._connection.ready();
            }

            event.connection.send(new InfoRetrieveMessageComposer());

            if(!isReconnect) this.scheduleMachineIDVerification();

            if(isReconnect)
            {
                OctaneLogger.log('[CommunicationManager] Dispatching SOCKET_REAUTHENTICATED');
                GetEventDispatcher().dispatchEvent(new SocketReauthenticatedEvent(
                    OctaneEventType.SOCKET_REAUTHENTICATED,
                    parser.sessionResumed,
                    parser.roomId));
            }
        });

        const disconnectEvent = new DisconnectReasonEvent((event: DisconnectReasonEvent) =>
        {
            const reason = event.getParser()?.reason ?? -1;

            OctaneLogger.log('[CommunicationManager] Server disconnect reason ' + reason);

            this._connection.serverDisconnected(reason);
        });

        this._messageEvents.push(pingEvent, authEvent, disconnectEvent);
        this._connection.addMessageEvent(pingEvent);
        this._connection.addMessageEvent(authEvent);
        this._connection.addMessageEvent(disconnectEvent);
    }

    public dispose(): void
    {
        this.cancelMachineIDVerification();

        // Stop pong interval
        this.stopPong();

        // Remove event dispatcher listeners
        if(this._socketClosedCallback)
        {
            GetEventDispatcher().removeEventListener(OctaneEventType.SOCKET_CLOSED, this._socketClosedCallback);
            this._socketClosedCallback = null;
        }

        if(this._socketOpenedCallback)
        {
            GetEventDispatcher().removeEventListener(OctaneEventType.SOCKET_OPENED, this._socketOpenedCallback);
            this._socketOpenedCallback = null;
        }

        if(this._socketErrorCallback)
        {
            GetEventDispatcher().removeEventListener(OctaneEventType.SOCKET_ERROR, this._socketErrorCallback);
            this._socketErrorCallback = null;
        }

        if(this._socketReconnectedCallback)
        {
            GetEventDispatcher().removeEventListener(OctaneEventType.SOCKET_RECONNECTED, this._socketReconnectedCallback);
            this._socketReconnectedCallback = null;
        }

        // Remove message events
        for(const event of this._messageEvents)
        {
            this._connection.removeMessageEvent(event);
        }
        this._messageEvents = [];
        this._listenersRegistered = false;
        this._recoveryToken = '';
    }

    protected startPong(): void
    {
        if(this._pongInterval) this.stopPong();

        this._pongInterval = setInterval(() => this.sendPong(), GetConfiguration().getValue<number>('system.pong.interval.ms', 20000));
    }

    protected stopPong(): void
    {
        if(!this._pongInterval) return;

        clearInterval(this._pongInterval);

        this._pongInterval = null;
    }

    protected sendPong(): void
    {
        this._connection?.send(new PongMessageComposer());
    }

    public registerMessageEvent(event: IMessageEvent): IMessageEvent
    {
        if(this._connection) this._connection.addMessageEvent(event);

        return event;
    }

    public removeMessageEvent(event: IMessageEvent): void
    {
        if(!this._connection) return;

        this._connection.removeMessageEvent(event);
    }

    public subscribeMessage<T extends IMessageEvent>(eventCtor: new (callback: (event: T) => void) => T, handler: (event: T) => void): () => void
    {
        if(!eventCtor || !handler) return () =>
        {};

        const event = new eventCtor(handler);

        this.registerMessageEvent(event);

        return () => this.removeMessageEvent(event);
    }

    public get connection(): IConnection
    {
        return this._connection;
    }
}
