import { GetEventDispatcher, OctaneEvent, OctaneEventType } from '@octane/events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CommunicationManager } from './CommunicationManager';
import { AuthenticatedEvent } from './messages';

vi.mock('@thumbmarkjs/thumbmarkjs', () => ({ Thumbmark: class
{
    get = async () => ({ thumbmark: 'test' });
} }));

const setup = () =>
{
    const manager = new CommunicationManager();
    const events: any[] = [];
    const connection = {
        isAuthenticated: false,
        hasBeenReady: false,
        init: vi.fn(),
        dispose: vi.fn(() =>
        {
            connection.isAuthenticated = false;
        }),
        authenticated: vi.fn(() =>
        {
            connection.isAuthenticated = true;
        }),
        ready: vi.fn(),
        send: vi.fn(),
        addMessageEvent: vi.fn((event: unknown) => events.push(event)),
        removeMessageEvent: vi.fn()
    };

    (manager as any)._connection = connection;

    const login = () =>
    {
        const auth = events.find(event => event instanceof AuthenticatedEvent);

        auth.callBack({ getParser: () => ({ recoveryToken: 'token', sessionResumed: false, roomId: 0 }), connection });
    };

    return { manager, connection, events, login };
};

afterEach(() => GetEventDispatcher().removeAllListeners());

describe('CommunicationManager.init', () =>
{
    it('replaces an attempt that never logged in with a fresh one', async () =>
    {
        const { manager, connection, events, login } = setup();
        const first = manager.init();
        const second = manager.init();

        await expect(first).rejects.toThrow('Replaced by a new connection attempt');
        expect(connection.dispose).toHaveBeenCalledOnce();
        expect(connection.init).toHaveBeenCalledTimes(2);
        // The packet and socket listeners are registered once, not per attempt.
        expect(events).toHaveLength(3);

        login();

        await expect(second).resolves.toBeUndefined();
    });

    it('resolves at once when already logged in', async () =>
    {
        const { manager, connection, login } = setup();
        const first = manager.init();

        login();
        await first;

        await expect(manager.init()).resolves.toBeUndefined();
        expect(connection.dispose).not.toHaveBeenCalled();
        expect(connection.init).toHaveBeenCalledOnce();
    });

    it('rejects only the current attempt on a socket error, and the next login starts over', async () =>
    {
        const { manager, connection, login } = setup();
        const first = manager.init();

        GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.SOCKET_ERROR));
        await expect(first).rejects.toThrow('Socket error before init resolved');

        const second = manager.init();

        expect(connection.dispose).toHaveBeenCalledOnce();

        login();

        await expect(second).resolves.toBeUndefined();
        // A fresh login, not a resume of the failed one.
        expect(connection.ready).not.toHaveBeenCalled();
    });
});
