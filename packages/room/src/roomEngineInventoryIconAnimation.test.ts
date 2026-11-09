import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomEngine } from '@octane/room';

const dispatched = vi.hoisted(() => [] as any[]);

vi.mock('@octane/events', async importOriginal => ({
    ...(await importOriginal<typeof import('@octane/events')>()),
    GetEventDispatcher: () => ({ addEventListener: vi.fn(), removeEventListener: vi.fn(), dispatchEvent: (event: unknown) => dispatched.push(event) })
}));

const animate = (engine: object, getImage: () => Promise<HTMLImageElement>) =>
    (RoomEngine.prototype as any).animateIconToInventory.call(engine, { getImage }, 10, 20);

const settle = () => new Promise(resolve => setTimeout(resolve, 0));

beforeEach(() =>
{
    dispatched.length = 0;
});

describe('RoomEngine inventory icon animation', () =>
{
    it('animates the icon once it is decoded', async () =>
    {
        animate({ _disposed: false }, () => Promise.resolve(new Image()));
        await settle();

        expect(dispatched).toHaveLength(1);
        expect(dispatched[0]).toMatchObject({ x: 10, y: 20 });
    });

    it('drops the animation when the engine was disposed while the icon decoded', async () =>
    {
        animate({ _disposed: true }, () => Promise.resolve(new Image()));
        await settle();

        expect(dispatched).toHaveLength(0);
    });

    it('swallows a failed decode instead of leaving an unhandled rejection', async () =>
    {
        animate({ _disposed: false }, () => Promise.reject(new Error('decode failed')));
        await settle();

        expect(dispatched).toHaveLength(0);
    });
});
