import { describe, expect, it, vi } from 'vitest';
import { GetEventDispatcher, RoomEngineObjectEvent } from '@octane/events';
// Through the package barrel: entering the utils module directly closes the import cycle with ../object first.
import { FurnitureVisualization, RoomAreaSelectionManager } from '@octane/room';

const createEngine = (objects: Map<number, unknown>) => ({
    activeRoomId: 1,
    moveBlocked: false,
    getRoomObjects: () => [],
    getRoomObject: (_roomId: number, objectId: number) => objects.get(objectId) ?? null
});

const added = (objectId: number) => new RoomEngineObjectEvent(RoomEngineObjectEvent.ADDED, 1, objectId, 10);

describe('RoomAreaSelectionManager furni added during a selection', () =>
{
    it('listens only while active, and tolerates an object that is already gone', () =>
    {
        const visualization = Object.create(FurnitureVisualization.prototype) as FurnitureVisualization;
        const lookThrough = vi.fn();

        Object.defineProperty(visualization, 'lookThrough', { set: lookThrough });

        const engine = createEngine(new Map([ [ 5, { visualization } ] ]));
        const manager = new RoomAreaSelectionManager(engine as never);
        const add = vi.spyOn(GetEventDispatcher(), 'addEventListener');
        const remove = vi.spyOn(GetEventDispatcher(), 'removeEventListener');

        GetEventDispatcher().dispatchEvent(added(5));
        expect(lookThrough).not.toHaveBeenCalled();

        manager.activate(vi.fn(), RoomAreaSelectionManager.HIGHLIGHT_BRIGHTEN);
        expect(add).toHaveBeenCalledWith(RoomEngineObjectEvent.ADDED, expect.any(Function));

        GetEventDispatcher().dispatchEvent(added(5));
        expect(lookThrough).toHaveBeenCalledWith(true);

        expect(() => GetEventDispatcher().dispatchEvent(added(99))).not.toThrow();

        manager.deactivate();
        expect(remove).toHaveBeenCalledWith(RoomEngineObjectEvent.ADDED, add.mock.calls.at(-1)[1]);
    });
});
