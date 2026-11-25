import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher, OctaneEventType } from '@octane/events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { IEarlySocket, SocketConnection } from './SocketConnection';

const URL = 'wss://game.example/ws';

class FakeSocket extends EventTarget
{
    public static CONNECTING = 0;
    public static OPEN = 1;
    public static CLOSING = 2;
    public static CLOSED = 3;
    public static created: FakeSocket[] = [];

    public readyState: number = FakeSocket.CONNECTING;
    public binaryType: string = 'blob';
    public protocol: string = '';
    public close = vi.fn(() =>
    {
        this.readyState = FakeSocket.CLOSED;
    });
    public send = vi.fn();

    constructor(public url: string = URL, public protocols?: string[])
    {
        super();
    }
}

class ConstructedSocket extends FakeSocket
{
    constructor(url: string, protocols?: string[])
    {
        super(url, protocols);
        FakeSocket.created.push(this);
    }
}

type Holder = { __octaneEarlySocket?: IEarlySocket };

const earlySocket = (overrides: Partial<IEarlySocket> = {}, readyState: number = FakeSocket.OPEN) =>
{
    const socket = new FakeSocket();

    socket.readyState = readyState;

    const early = { url: URL, socket: socket as unknown as WebSocket, opened: readyState === FakeSocket.OPEN, closed: null, errored: false, messages: [], detach: vi.fn(), ...overrides };

    (globalThis as Holder).__octaneEarlySocket = early;

    return { ...early, fake: socket };
};

const openedEvents = () =>
{
    const opened = vi.fn();

    GetEventDispatcher().addEventListener(OctaneEventType.SOCKET_OPENED, opened);

    return opened;
};

beforeEach(() =>
{
    FakeSocket.created = [];
    vi.stubGlobal('WebSocket', ConstructedSocket);
});

afterEach(() =>
{
    delete (globalThis as Holder).__octaneEarlySocket;
    GetConfiguration().setValue('crypto.ws.enabled', false);
    GetEventDispatcher().removeAllListeners();
    vi.unstubAllGlobals();
});

describe('SocketConnection early socket', () =>
{
    it('takes over an open early socket and replays what it already received', async () =>
    {
        const message = new Uint8Array([ 0, 0, 0, 2, 0, 1 ]).buffer;
        const early = earlySocket({ messages: [ message ] });
        const opened = openedEvents();
        const connection = new SocketConnection();
        const received = vi.spyOn(connection as unknown as { onSocketMessage(data: ArrayBuffer): void }, 'onSocketMessage');

        connection.init(URL);

        expect(early.detach).toHaveBeenCalledOnce();
        expect(FakeSocket.created).toHaveLength(0);
        expect((globalThis as Holder).__octaneEarlySocket).toBeUndefined();
        expect(early.fake.binaryType).toBe('arraybuffer');

        await Promise.resolve();

        expect(opened).toHaveBeenCalledOnce();
        expect(received).toHaveBeenCalledWith(message);

        connection.dispose();
    });

    it('waits for an early socket that is still connecting to open', async () =>
    {
        const early = earlySocket({}, FakeSocket.CONNECTING);
        const opened = openedEvents();
        const connection = new SocketConnection();

        connection.init(URL);
        await Promise.resolve();

        expect(opened).not.toHaveBeenCalled();

        early.fake.readyState = FakeSocket.OPEN;
        early.fake.dispatchEvent(new Event('open'));

        expect(opened).toHaveBeenCalledOnce();

        connection.dispose();
    });

    it.each([
        [ 'another address', { url: 'wss://other.example/ws' }, FakeSocket.OPEN ],
        [ 'a closed socket', { closed: new Event('close') as CloseEvent }, FakeSocket.OPEN ],
        [ 'a failed socket', { errored: true }, FakeSocket.OPEN ],
        [ 'a closing socket', {}, FakeSocket.CLOSING ]
    ])('closes an early socket to %s and connects anew', async (_label, overrides, readyState) =>
    {
        const early = earlySocket(overrides, readyState);
        const connection = new SocketConnection();

        connection.init(URL);

        expect(early.fake.close).toHaveBeenCalled();
        expect(FakeSocket.created).toHaveLength(1);
        expect(FakeSocket.created[0].url).toBe(URL);

        connection.dispose();
    });

    it('does not use an early socket for an encrypted session', () =>
    {
        GetConfiguration().setValue('crypto.ws.enabled', true);

        const early = earlySocket();
        const connection = new SocketConnection();

        connection.init(URL);

        expect(early.fake.close).toHaveBeenCalled();
        expect(FakeSocket.created).toHaveLength(1);

        connection.dispose();
    });
});
