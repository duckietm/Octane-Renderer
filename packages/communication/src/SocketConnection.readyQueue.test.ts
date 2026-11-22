import { IMessageDataWrapper } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { IncomingHeader } from './messages';
import { SocketConnection } from './SocketConnection';

type Internals = {
    _isAuthenticated: boolean;
    processWrappers(...wrappers: IMessageDataWrapper[]): void;
    processWrapper(wrapper: IMessageDataWrapper): void;
};

const AUTH = IncomingHeader.AUTHENTICATED;
const OTHER = 1000;

const setup = () =>
{
    const connection = new SocketConnection();
    const internals = connection as unknown as Internals;
    const handled: number[] = [];

    // The authentication handler marks the connection authenticated, like CommunicationManager does.
    vi.spyOn(internals, 'processWrapper').mockImplementation((wrapper: IMessageDataWrapper) =>
    {
        handled.push(wrapper.header);

        if(wrapper.header === AUTH) connection.authenticated();
    });

    return { connection, internals, handled };
};

const wrapper = (header: number) => ({ header }) as IMessageDataWrapper;

describe('SocketConnection ready queue', () =>
{
    it('holds the rest of a batch that arrives with the authentication until ready()', () =>
    {
        const { connection, internals, handled } = setup();

        internals.processWrappers(wrapper(AUTH), wrapper(OTHER), wrapper(OTHER + 1));

        expect(handled).toEqual([ AUTH ]);

        connection.ready();

        expect(handled).toEqual([ AUTH, OTHER, OTHER + 1 ]);
        expect(connection.hasBeenReady).toBe(true);
    });

    it('answers pings and reads disconnect reasons while the hotel is still loading', () =>
    {
        const { connection, internals, handled } = setup();

        internals.processWrappers(wrapper(AUTH), wrapper(OTHER), wrapper(IncomingHeader.CLIENT_PING), wrapper(IncomingHeader.DISCONNECT_REASON));

        expect(handled).toEqual([ AUTH, IncomingHeader.CLIENT_PING, IncomingHeader.DISCONNECT_REASON ]);
        expect(connection.hasBeenReady).toBe(false);

        connection.ready();

        expect(handled).toEqual([ AUTH, IncomingHeader.CLIENT_PING, IncomingHeader.DISCONNECT_REASON, OTHER ]);
    });
});

describe('SocketConnection held sends', () =>
{
    it('sends a pong while other messages wait for ready()', async () =>
    {
        const { PongMessageComposer } = await import('./messages');
        const connection = new SocketConnection();
        const internals = connection as unknown as { _isAuthenticated: boolean; _pendingClientMessages: unknown[]; write(buffer: ArrayBuffer): void };
        const write = vi.spyOn(internals, 'write').mockImplementation(() => undefined);
        const other = { getMessageArray: () => [] };

        connection.registerMessages({ events: new Map(), composers: new Map([ [ 2596, PongMessageComposer ] ]) });
        internals._isAuthenticated = true;

        connection.send(other as never, new PongMessageComposer());

        expect(write).toHaveBeenCalledOnce();
        expect(internals._pendingClientMessages).toEqual([ other ]);
    });
});
