import { IConnection, IMessageEvent, RoomObjectCategory } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher } from '@octane/events';
import { RoomSessionManager } from '../../../session/src/RoomSessionManager';
import { afterEach, describe, expect, it } from 'vitest';
import { CommunicationManager } from '../CommunicationManager';
import { GetCommunication } from '../GetCommunication';
import {
    FurnitureAliasesComposer,
    FurnitureFloorAddEvent,
    FurnitureFloorRemoveEvent,
    FurnitureListComposer,
    FurnitureListEvent,
    FurnitureListInvalidateEvent,
    FurnitureListRemovedEvent,
    FurniturePickupComposer,
    FurniturePlaceComposer,
    RequestFurniInventoryWhenNotInRoomComposer,
    UnseenItemsEvent
} from '../messages';
import { readE2eEnvironment } from './e2eEnvironment';
import { InventoryItemIdentity, InventorySnapshotCollector, formatInventoryDiagnostics } from './inventoryE2eSupport';
import { waitFor } from './waitFor';

const ITEM_ID = 900004;
const ITEM_SPRITE_ID = 18;
const OWNED_FURNITURE_CATEGORY = 1;

interface InventoryLog
{
    snapshots: InventoryItemIdentity[][];
    removedInventoryIds: number[];
    roomAdds: Array<{ itemId: number; x: number; y: number; direction: number }>;
    roomRemovals: number[];
    unseenOwnedFurnitureIds: number[];
    invalidations: number;
    timeline: string[];
}

const identity = (item: { itemId: number; ref: number; spriteId: number; furniType: string; category: number; extra: number }): InventoryItemIdentity => ({
    itemId: item.itemId,
    ref: item.ref,
    spriteId: item.spriteId,
    furniType: item.furniType,
    category: item.category,
    extra: item.extra
});

const attachInventoryLog = (connection: IConnection): { log: InventoryLog; dispose(): void } =>
{
    const collector = new InventorySnapshotCollector();
    const events: IMessageEvent[] = [];
    const log: InventoryLog = {
        snapshots: [], removedInventoryIds: [], roomAdds: [], roomRemovals: [],
        unseenOwnedFurnitureIds: [], invalidations: 0, timeline: []
    };
    const register = (event: IMessageEvent): void =>
    {
        events.push(event); connection.addMessageEvent(event);
    };

    register(new FurnitureListEvent((event: FurnitureListEvent) =>
    {
        const parser = event.getParser();
        const snapshot = collector.record({
            totalFragments: parser.totalFragments,
            fragmentNumber: parser.fragmentNumber,
            items: [ ...parser.fragment.values() ].map(identity)
        });
        log.timeline.push(`inventory-fragment:${ parser.fragmentNumber }/${ parser.totalFragments }`);
        if(snapshot)
        {
            log.snapshots.push(snapshot);
            log.timeline.push(`inventory:${ snapshot.length }`);
        }
    }));
    register(new FurnitureListRemovedEvent((event: FurnitureListRemovedEvent) =>
    {
        const itemId = event.getParser().itemId;
        log.removedInventoryIds.push(itemId);
        log.timeline.push(`inventory-remove:${ itemId }`);
    }));
    register(new FurnitureListInvalidateEvent(() =>
    {
        log.invalidations++;
        log.timeline.push('inventory-invalidate');
    }));
    register(new FurnitureFloorAddEvent((event: FurnitureFloorAddEvent) =>
    {
        const item = event.getParser().item;
        log.roomAdds.push({ itemId: item.itemId, x: item.x, y: item.y, direction: item.direction });
        log.timeline.push(`room-add:${ item.itemId }`);
    }));
    register(new FurnitureFloorRemoveEvent((event: FurnitureFloorRemoveEvent) =>
    {
        const itemId = event.getParser().itemId;
        log.roomRemovals.push(itemId);
        log.timeline.push(`room-remove:${ itemId }`);
    }));
    register(new UnseenItemsEvent((event: UnseenItemsEvent) =>
    {
        const itemIds = event.getParser().getItemsByCategory(OWNED_FURNITURE_CATEGORY) ?? [];
        log.unseenOwnedFurnitureIds.push(...itemIds);
        log.timeline.push(`unseen:${ itemIds.join(',') }`);
    }));

    return {
        log,
        dispose: () =>
        {
            for(const event of events) connection.removeMessageEvent(event);
        }
    };
};

const readRoomId = async (probeUrl: string, userId: number): Promise<number> =>
{
    const response = await fetch(`${ probeUrl }/room-state?userId=${ userId }`);
    if(!response.ok) throw new Error(`Room-state probe failed with HTTP ${ response.status }`);
    return ((await response.json()) as { roomId: number }).roomId;
};

describe('Polaris inventory lifecycle', () =>
{
    let manager: CommunicationManager = null;
    let roomSessionManager: RoomSessionManager = null;
    let disposeLog: (() => void) = null;

    afterEach(() =>
    {
        disposeLog?.();
        manager?.connection.dispose();
        manager?.dispose();
        GetEventDispatcher().removeAllListeners();
        GetConfiguration().resetConfiguration();
    });

    it('loads, places, picks up and persists one owned floor item', async () =>
    {
        const environment = readE2eEnvironment(process.env);
        const configuration = GetConfiguration();
        configuration.resetConfiguration();
        configuration.setValue('socket.url', environment.wsUrl);
        configuration.setValue('sso.ticket', environment.ssoTicket);
        configuration.setValue('crypto.ws.enabled', false);
        configuration.setValue('system.pong.manually', false);

        manager = GetCommunication();
        (manager as unknown as { _machineIdPromise: Promise<string> })._machineIdPromise = Promise.resolve('IID-E2E-INVENTORY');
        roomSessionManager = new RoomSessionManager();
        await roomSessionManager.init();
        const recorder = attachInventoryLog(manager.connection);
        disposeLog = recorder.dispose;

        await manager.init();
        manager.connection.ready();

        const wait = async (predicate: () => boolean | Promise<boolean>, description: string, timeoutMs = 10000): Promise<void> =>
        {
            try
            {
                await waitFor(predicate, { timeoutMs, description });
            }
            catch (error)
            {
                throw new Error(`${ (error as Error).message }; ${ formatInventoryDiagnostics(ITEM_ID, recorder.log.timeline) }`);
            }
        };

        manager.connection.send(new RequestFurniInventoryWhenNotInRoomComposer());
        await wait(() => recorder.log.snapshots.length === 1, 'initial authoritative inventory');
        const initialMatches = recorder.log.snapshots[0].filter(item => item.itemId === ITEM_ID);
        expect(initialMatches).toEqual([ expect.objectContaining({
            itemId: ITEM_ID,
            ref: ITEM_ID,
            spriteId: ITEM_SPRITE_ID,
            furniType: 'S',
            category: OWNED_FURNITURE_CATEGORY,
            extra: 1
        }) ]);

        expect(roomSessionManager.createSession(environment.roomId)).toBe(true);
        manager.connection.send(new FurnitureAliasesComposer());
        await wait(async () => (await readRoomId(environment.probeUrl, environment.userId)) === environment.roomId, 'synthetic room entry');

        manager.connection.send(new FurniturePlaceComposer(ITEM_ID, RoomObjectCategory.FLOOR, '', 5, 5, 2));
        await wait(() => recorder.log.removedInventoryIds.includes(ITEM_ID)
            && recorder.log.roomAdds.some(item => item.itemId === ITEM_ID), 'inventory placement transition');
        expect(recorder.log.roomAdds.find(item => item.itemId === ITEM_ID)).toEqual({ itemId: ITEM_ID, x: 5, y: 5, direction: 90 });

        manager.connection.send(new FurniturePickupComposer(RoomObjectCategory.FLOOR, ITEM_ID));
        await wait(() => recorder.log.roomRemovals.includes(ITEM_ID)
            && recorder.log.unseenOwnedFurnitureIds.includes(ITEM_ID)
            && recorder.log.invalidations > 0, 'inventory pickup transition');

        manager.connection.send(new FurnitureListComposer());
        await wait(() => recorder.log.snapshots.length === 2, 'final authoritative inventory');
        const finalMatches = recorder.log.snapshots[1].filter(item => item.itemId === ITEM_ID);
        expect(finalMatches).toEqual([ expect.objectContaining({
            itemId: ITEM_ID,
            ref: ITEM_ID,
            spriteId: ITEM_SPRITE_ID,
            furniType: 'S',
            category: OWNED_FURNITURE_CATEGORY,
            extra: 1
        }) ]);
        expect(finalMatches[0]).toEqual(initialMatches[0]);
    });
});
