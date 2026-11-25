import { GetEventDispatcher, OctaneEvent, OctaneEventType } from '@octane/events';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { CommunicationManager, MACHINE_ID_STORAGE_KEY } from './CommunicationManager';
import { AuthenticatedEvent, ClientHelloMessageComposer, SSOTicketMessageComposer, UniqueIDMessageComposer } from './messages';

const fingerprint = vi.hoisted(() => ({ value: 'freshfingerprint1', calls: 0 }));

vi.mock('@thumbmarkjs/thumbmarkjs', () => ({ Thumbmark: class
{
    get = async () =>
    {
        fingerprint.calls++;

        return { thumbmark: fingerprint.value };
    };
} }));

const setup = () =>
{
    const manager = new CommunicationManager();
    const events: any[] = [];
    const connection = {
        isAuthenticated: false,
        hasBeenReady: false,
        init: vi.fn(),
        dispose: vi.fn(),
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

    const open = async () =>
    {
        GetEventDispatcher().dispatchEvent(new OctaneEvent(OctaneEventType.SOCKET_OPENED));

        await vi.waitFor(() => expect(connection.send.mock.calls.some(([ composer ]) => composer instanceof SSOTicketMessageComposer)).toBe(true));
    };

    const sentMachineIds = () => connection.send.mock.calls
        .map(([ composer ]) => composer)
        .filter(composer => composer instanceof UniqueIDMessageComposer)
        .map(composer => composer.getMessageArray()[0]);

    return { manager, connection, login, open, sentMachineIds };
};

beforeEach(() =>
{
    fingerprint.value = 'freshfingerprint1';
    fingerprint.calls = 0;
    localStorage.clear();
});

afterEach(() =>
{
    GetEventDispatcher().removeAllListeners();
    vi.useRealTimers();
    localStorage.clear();
});

describe('CommunicationManager machine id', () =>
{
    it('computes and remembers the fingerprint on a first login, sent before the ticket', async () =>
    {
        const { manager, connection, open, sentMachineIds } = setup();

        void manager.init().catch(() => null);
        await open();

        const sent = connection.send.mock.calls.map(([ composer ]) => composer.constructor);

        expect(sent.slice(0, 3)).toEqual([ ClientHelloMessageComposer, UniqueIDMessageComposer, SSOTicketMessageComposer ]);
        expect(sentMachineIds()).toEqual([ 'IID-freshfingerprint1' ]);
        expect(localStorage.getItem(MACHINE_ID_STORAGE_KEY)).toBe('IID-freshfingerprint1');
    });

    it('logs in with the remembered fingerprint and sends the real one after the login when it changed', async () =>
    {
        vi.useFakeTimers({ toFake: [ 'setTimeout', 'clearTimeout' ] });
        localStorage.setItem(MACHINE_ID_STORAGE_KEY, 'IID-rememberedvalue');
        fingerprint.value = 'newfingerprint99';

        const { manager, open, login, sentMachineIds } = setup();
        const connected = manager.init();

        await open();

        expect(sentMachineIds()).toEqual([ 'IID-rememberedvalue' ]);
        expect(fingerprint.calls).toBe(0);

        login();
        await connected;

        await vi.advanceTimersByTimeAsync(2500);
        await vi.waitFor(() => expect(sentMachineIds()).toEqual([ 'IID-rememberedvalue', 'IID-newfingerprint99' ]));
        expect(localStorage.getItem(MACHINE_ID_STORAGE_KEY)).toBe('IID-newfingerprint99');
    });

    it('sends nothing more when the remembered fingerprint is still right', async () =>
    {
        vi.useFakeTimers({ toFake: [ 'setTimeout', 'clearTimeout' ] });
        localStorage.setItem(MACHINE_ID_STORAGE_KEY, 'IID-freshfingerprint1');

        const { manager, open, login, sentMachineIds } = setup();
        const connected = manager.init();

        await open();
        login();
        await connected;

        await vi.advanceTimersByTimeAsync(2500);
        await vi.waitFor(() => expect(fingerprint.calls).toBe(1));
        expect(sentMachineIds()).toEqual([ 'IID-freshfingerprint1' ]);
    });

    it('ignores a remembered value that is not a machine id', async () =>
    {
        localStorage.setItem(MACHINE_ID_STORAGE_KEY, 'IID-x"; drop');

        const { manager, open, sentMachineIds } = setup();

        void manager.init().catch(() => null);
        await open();

        expect(sentMachineIds()).toEqual([ 'IID-freshfingerprint1' ]);
    });

    it('drops a pending check when disposed', async () =>
    {
        vi.useFakeTimers({ toFake: [ 'setTimeout', 'clearTimeout' ] });
        localStorage.setItem(MACHINE_ID_STORAGE_KEY, 'IID-rememberedvalue');

        const { manager, open, login } = setup();
        const connected = manager.init();

        await open();
        login();
        await connected;

        manager.dispose();
        await vi.advanceTimersByTimeAsync(5000);

        expect(fingerprint.calls).toBe(0);
    });
});
