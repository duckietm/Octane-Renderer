import { RoomObjectCategory, RoomObjectVariable } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';
import { AvatarVisualization } from './object';
import { RoomWindowReflectionState } from './object/visualization/RoomWindowReflectionState';
import { WIRED_HIGHLIGHT_NEON_AURA, WIRED_HIGHLIGHT_OUTLINE, WIRED_HIGHLIGHT_SOFT_GLOW, WiredHighlightFilterCache } from './object/visualization/WiredHighlightFilters';

const manager = vi.hoisted(() => ({ atlasEnabled: false, flushCompositions: vi.fn(), lastCompositionFlushJobs: 0, lastCompositionFlushMs: 0 }));

vi.mock('@octane/avatar', async importOriginal => ({
    ...await importOriginal<object>(),
    GetAvatarRenderManager: () => manager
}));

vi.mock('./GetRoomMessageHandler', () => ({
    GetRoomMessageHandler: () => ({})
}));

vi.mock('./GetRoomEngine', () => ({
    GetRoomEngine: (): null => null
}));

beforeEach(() =>
{
    manager.atlasEnabled = false;
    manager.flushCompositions.mockReset();
});

describe('RoomEngine.setAvatarAtlasMode', () =>
{
    const avatar = () =>
    {
        const visualization = Object.create(AvatarVisualization.prototype) as AvatarVisualization;

        visualization.recreateAvatarImages = vi.fn();

        return visualization;
    };

    const createEngine = (visualizations: object[]) =>
    {
        const engine = Object.create(RoomEngine.prototype) as RoomEngine;
        const categories: number[] = [];
        const room = {
            getRoomObjectsForCategory: (category: number) =>
            {
                categories.push(category);

                return visualizations.map(visualization => ({ visualization }));
            }
        };

        Object.assign(engine, { _roomManager: { rooms: new Map([ [ '1', room ] ]) } });

        return { engine, categories };
    };

    it('is off until it is switched on, and reports the mode in use', () =>
    {
        const { engine } = createEngine([]);

        expect(engine.avatarsDrawnInAtlas).toBe(false);

        engine.setAvatarAtlasMode(true);

        expect(manager.atlasEnabled).toBe(true);
        expect(engine.avatarsDrawnInAtlas).toBe(true);

        engine.setAvatarAtlasMode(false);

        expect(engine.avatarsDrawnInAtlas).toBe(false);
    });

    it('makes the avatars in every room draw again through the other path, and only when the mode changes', () =>
    {
        const avatars = [ avatar(), avatar() ];
        const pet = { recreateAvatarImages: vi.fn() };
        const { engine, categories } = createEngine([ ...avatars, pet, null ]);

        engine.setAvatarAtlasMode(false);

        for(const visualization of avatars) expect(visualization.recreateAvatarImages).not.toHaveBeenCalled();

        engine.setAvatarAtlasMode(true);

        expect(categories).toEqual([ RoomObjectCategory.UNIT ]);
        for(const visualization of avatars) expect(visualization.recreateAvatarImages).toHaveBeenCalledOnce();
        // Only avatar visualizations hold avatar images.
        expect(pet.recreateAvatarImages).not.toHaveBeenCalled();

        engine.setAvatarAtlasMode(true);

        for(const visualization of avatars) expect(visualization.recreateAvatarImages).toHaveBeenCalledOnce();

        engine.setAvatarAtlasMode(false);

        for(const visualization of avatars) expect(visualization.recreateAvatarImages).toHaveBeenCalledTimes(2);
    });

    it('switches the mode before any room exists', () =>
    {
        const engine = Object.create(RoomEngine.prototype) as RoomEngine;

        Object.assign(engine, { _roomManager: null });

        expect(() => engine.setAvatarAtlasMode(true)).not.toThrow();
        expect(manager.atlasEnabled).toBe(true);
    });
});

describe('AvatarVisualization and the atlas flush', () =>
{
    const zoneOwner = {};

    afterEach(() => RoomWindowReflectionState.unregisterZone(zoneOwner));

    // Strength 0 is an avatar without a wired highlight.
    const createVisualization = (highlightType: number, highlightStrength: number, location: Vector3d) =>
    {
        const visualization = Object.create(AvatarVisualization.prototype) as AvatarVisualization;
        const highlight = new WiredHighlightFilterCache();

        highlight.update(highlightType, highlightStrength, 0xFFFFFF);

        Object.assign(visualization, {
            _wiredHighlight: highlight,
            _object: {
                getLocation: () => location,
                model: { getValue: (key: string): string => ((key === RoomObjectVariable.OBJECT_ROOM_ID) ? '7' : null) }
            }
        });

        return visualization as unknown as { canDeferAvatarTexture(): boolean, object: object };
    };

    it('lets a plain avatar wait for the flush', () =>
    {
        const visualization = createVisualization(0, 0, new Vector3d(5, 5, 0));

        expect(visualization.object).toBeTruthy();
        expect(visualization.canDeferAvatarTexture()).toBe(true);
    });

    it('draws at once while the wired glow copies the body', () =>
    {
        // Outline, soft glow and neon aura are drawn behind the avatar from a copy of its pixels.
        const immediate = [ 0, 1, 2, 3, 4, 5 ].filter(type => !createVisualization(type, 50, new Vector3d(5, 5, 0)).canDeferAvatarTexture());

        expect(immediate).toEqual([ WIRED_HIGHLIGHT_OUTLINE, WIRED_HIGHLIGHT_SOFT_GLOW, WIRED_HIGHLIGHT_NEON_AURA ]);
    });

    it('draws at once next to a window that reflects the avatar, and waits again away from it', () =>
    {
        RoomWindowReflectionState.registerZone(zoneOwner, new Vector3d(0, 5, 0), new Vector3d(1, 0, 0), '7');

        expect(createVisualization(0, 0, new Vector3d(0.5, 5, 0)).canDeferAvatarTexture()).toBe(false);
        expect(createVisualization(0, 0, new Vector3d(6, 5, 0)).canDeferAvatarTexture()).toBe(true);
    });

    it('draws waiting cells before the object image copies the sprites', () =>
    {
        const visualization = Object.create(AvatarVisualization.prototype) as AvatarVisualization;

        Object.assign(visualization, { _sprites: [] });

        expect(visualization.getImage()).toBeNull();
        expect(manager.flushCompositions).toHaveBeenCalledOnce();
    });
});
