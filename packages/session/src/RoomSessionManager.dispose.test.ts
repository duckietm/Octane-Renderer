import { afterEach, describe, expect, it, vi } from 'vitest';

const { connection, dispatcher } = vi.hoisted(() =>
{
    const events = new Set<unknown>();
    const listeners = new Map<string, Set<unknown>>();

    return {
        connection: {
            events,
            addMessageEvent: (event: unknown) => events.add(event),
            removeMessageEvent: (event: unknown) => events.delete(event),
            send: () => undefined
        },
        dispatcher: {
            listeners,
            addEventListener: (type: string, callback: unknown) => listeners.set(type, (listeners.get(type) ?? new Set()).add(callback)),
            removeEventListener: (type: string, callback: unknown) => listeners.get(type)?.delete(callback),
            dispatchEvent: () => undefined
        }
    };
});

vi.mock('@octane/communication', async importOriginal => ({
    ...(await importOriginal<typeof import('@octane/communication')>()),
    GetCommunication: () => ({ connection })
}));

vi.mock('@octane/events', async importOriginal => ({
    ...(await importOriginal<typeof import('@octane/events')>()),
    GetEventDispatcher: () => dispatcher
}));

import { RoomSessionManager } from './RoomSessionManager';

const listenerCount = () => [ ...dispatcher.listeners.values() ].reduce((total, set) => total + set.size, 0);

describe('RoomSessionManager dispose', () =>
{
    afterEach(() =>
    {
        connection.events.clear();
        dispatcher.listeners.clear();
    });

    it('registers its handlers and socket listeners once however many times init runs', async () =>
    {
        const manager = new RoomSessionManager();

        await manager.init();
        const packets = connection.events.size;
        const listeners = listenerCount();
        await manager.init();

        expect(packets).toBeGreaterThan(0);
        expect(connection.events.size).toBe(packets);
        expect(listenerCount()).toBe(listeners);
    });

    it('takes back every packet and listener, and a later init registers them afresh', async () =>
    {
        const manager = new RoomSessionManager();

        await manager.init();
        const packets = connection.events.size;
        manager.dispose();

        expect(connection.events.size).toBe(0);
        expect(listenerCount()).toBe(0);

        await manager.init();

        expect(connection.events.size).toBe(packets);
    });
});
