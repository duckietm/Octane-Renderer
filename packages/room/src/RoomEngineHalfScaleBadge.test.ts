import { GetTexturePool } from '@octane/utils';
import { Texture } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomEngine } from './RoomEngine';

vi.mock('./GetRoomEngine', () => ({ GetRoomEngine: () => null }));
vi.mock('./GetRoomManager', () => ({ GetRoomManager: () => null }));
vi.mock('./GetRoomMessageHandler', () => ({ GetRoomMessageHandler: () => ({ dispose: vi.fn() }) }));

// Every furni with the same badge rendered a new half-size copy from the texture pool, and when the
// collection already held it (or had none) the copy never went back: one GPU texture lost per group
// furni placed or loaded, in every room visited.
const fixture = (assets: Set<string> | null, accepts = true) =>
{
    const engine = Object.create(RoomEngine.prototype) as RoomEngine;
    const smallBadge = Texture.EMPTY;
    const added: string[] = [];
    const createHalfScaleBadge = vi.fn(() => smallBadge);

    Object.assign(engine, {
        _sessionDataManager: { loadBadgeImage: () => 'badge_name', getBadgeImage: () => Texture.WHITE },
        _roomContentLoader: {
            getCollection: () => (assets ? { getAsset: (name: string) => (assets.has(name) ? {} : null) } : null),
            addAssetToCollection: (_type: string, name: string) =>
            {
                added.push(name);
                return name.endsWith('_32') ? accepts : true;
            }
        },
        createHalfScaleBadge
    });

    const put = () => (engine as any).putBadgeInObjectAssets({ type: 'group_furni' }, 'ABC', false);

    return { put, createHalfScaleBadge, added, smallBadge };
};

afterEach(() => vi.restoreAllMocks());

describe('half-size badge assets', () =>
{
    it('renders the half-size badge once, while the collection lacks it', () =>
    {
        const { put, createHalfScaleBadge, added } = fixture(new Set());

        put();

        expect(createHalfScaleBadge).toHaveBeenCalledTimes(1);
        expect(added).toContain('badge_name_32');
    });

    it('renders nothing when the collection already holds it', () =>
    {
        const { put, createHalfScaleBadge } = fixture(new Set([ 'badge_name_32' ]));

        put();

        expect(createHalfScaleBadge).not.toHaveBeenCalled();
    });

    it('renders nothing for an object type with no collection', () =>
    {
        const { put, createHalfScaleBadge } = fixture(null);

        put();

        expect(createHalfScaleBadge).not.toHaveBeenCalled();
    });

    it('gives a copy the collection refused back to the pool', () =>
    {
        const putTexture = vi.spyOn(GetTexturePool(), 'putTexture').mockImplementation(() => undefined);
        const { put, smallBadge } = fixture(new Set(), false);

        put();

        expect(putTexture).toHaveBeenCalledWith(smallBadge);
    });
});
