import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

// Each fake encryption resolves after a delay chosen by the test, so later packets can finish first.
const delays = new Map<number, number>();
const config = new Map<string, unknown>();

vi.mock('./crypto', () => ({
    NONCE_LEN: 1,
    randomNonce: () => new Uint8Array([ 0 ]),
    aesGcmEncrypt: (_key: unknown, _nonce: Uint8Array, plaintext: ArrayBuffer) =>
        new Promise<ArrayBuffer>(resolve => setTimeout(() => resolve(plaintext), delays.get(new Uint8Array(plaintext)[0]) ?? 0)),
    aesGcmDecrypt: vi.fn(),
    parseServerHello: () => ({ pubkeySpki: new Uint8Array(), signature: null }),
    importPublicKeySpki: async () => ({}),
    generateEphemeralKeyPair: async () => ({ privateKey: {}, publicKey: {} }),
    exportPublicKeySpki: async () => new Uint8Array(),
    deriveSharedSecret: async () => ({}),
    deriveAesKey: async () => ({}),
    buildClientHello: () => new Uint8Array([ 255, 255 ]).buffer,
    importSigningPublicKeyFromBase64: vi.fn(),
    verifyEphemeralSignature: vi.fn(),
    // Version 2 is only used when the server answers its subprotocol; the fake socket here has none.
    SUBPROTOCOL_V2: 'octane-ws-v2',
    DIRECTION_CLIENT_TO_SERVER: 1,
    DIRECTION_SERVER_TO_CLIENT: 2,
    deriveDirectionalKeys: vi.fn(),
    directionalNonce: vi.fn(),
    readDirectionalNonce: vi.fn()
}));

vi.mock('@octane/configuration', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetConfiguration: () => ({ getValue: (key: string, fallback: unknown) => (config.has(key) ? config.get(key) : fallback), interpolate: (value: string) => value })
}));

import { SocketConnection } from './SocketConnection';

type Internals = {
    _socket: { readyState: number, send: (data: ArrayBuffer) => void };
    _cryptoState: string;
    _sessionKey: unknown;
    write(buffer: ArrayBuffer): void;
    handleServerHello(frame: ArrayBuffer): Promise<void>;
};

const packet = (id: number) => new Uint8Array([ id ]).buffer;

const setup = (state: string) =>
{
    const sent: number[] = [];
    const internals = new SocketConnection() as unknown as Internals;

    internals._socket = {
        readyState: WebSocket.OPEN,
        // A framed packet is the one-byte fake nonce followed by the plaintext; the hello is [255, 255].
        send: (data: ArrayBuffer) => sent.push(new Uint8Array(data)[1])
    };
    internals._cryptoState = state;
    internals._sessionKey = {};

    return { internals, sent };
};

const settle = () => new Promise(resolve => setTimeout(resolve, 120));

describe('SocketConnection encrypted send order', () =>
{
    beforeEach(() =>
    {
        delays.clear();
        config.clear();
    });
    afterEach(() => vi.useRealTimers());

    it('sends packets in the order they were written, whichever encryption finishes first', async () =>
    {
        const { internals, sent } = setup('ready');
        delays.set(1, 60);
        delays.set(2, 30);
        delays.set(3, 0);

        internals.write(packet(1));
        internals.write(packet(2));
        internals.write(packet(3));
        await settle();

        expect(sent).toEqual([ 1, 2, 3 ]);
    });

    it('a packet written once the handshake is ready waits behind the queued ones', async () =>
    {
        const { internals, sent } = setup('awaiting_server_hello');
        delays.set(1, 60);
        delays.set(2, 30);
        delays.set(3, 0);

        internals.write(packet(1));
        internals.write(packet(2));
        const handshake = internals.handleServerHello(new ArrayBuffer(0));
        // Write as soon as the state turns ready, while the queued packets are still encrypting.
        while(internals._cryptoState !== 'ready') await Promise.resolve();
        internals.write(packet(3));
        await handshake;
        await settle();

        expect(sent).toEqual([ 255, 1, 2, 3 ]);
    });

    it('refuses the version 1 session when crypto.ws.require_v2 is set and the server did not take version 2', async () =>
    {
        config.set('crypto.ws.require_v2', true);
        const { internals, sent } = setup('awaiting_server_hello');

        await expect(internals.handleServerHello(new ArrayBuffer(0))).rejects.toThrow('crypto.ws.require_v2');
        expect(sent).toEqual([]);
    });
});
