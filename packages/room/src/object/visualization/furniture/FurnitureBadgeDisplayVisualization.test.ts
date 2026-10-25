import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const badgeImage = { current: null as unknown };

vi.mock('@octane/session', () => ({
    GetSessionDataManager: () => ({ getBadgeImage: () => badgeImage.current, getGroupBadgeImage: (): unknown => null })
}));

vi.mock('@octane/configuration', () => ({
    GetConfiguration: () => ({ getValue: () => '/badges/%badgename%.gif' })
}));

vi.mock('pixi.js', async importOriginal => ({
    ...(await importOriginal<object>()),
    Texture: { from: () => ({ source: { update: vi.fn() }, destroy: vi.fn() }) }
}));

import { FurnitureBadgeDisplayVisualization } from './FurnitureBadgeDisplayVisualization';

// The badge display drew GIF frames into the badge texture shared through the session's image cache,
// fetched every badge again for every display, and after the room was left a decode still finishing
// created an AnimatedSprite that stayed on the Ticker for good.
const display = () =>
{
    const visualization = Object.create(FurnitureBadgeDisplayVisualization.prototype);
    const asset = { addAsset: vi.fn(() => true), disposeAsset: vi.fn() };

    Object.assign(visualization, {
        _instance: 7, _badgeId: '', _badgeAssetNameNormalScale: '', _ownsBadgeAsset: false,
        _badgeCanvas: null, _badgeTexture: null, _decoded: null, _animationStart: -1,
        _lastFrameIndex: -1, _request: 0, _disposed: false
    });
    Object.defineProperty(visualization, 'asset', { get: () => asset });

    return { visualization, asset };
};

const sharedBadge = () =>
{
    const resource = document.createElement('canvas');
    resource.width = 40;
    resource.height = 40;

    return { source: { resource, update: vi.fn() } };
};

beforeEach(() =>
{
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(() => ({ drawImage: vi.fn(), clearRect: vi.fn() }) as never);
});

afterEach(() =>
{
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
});

describe('FurnitureBadgeDisplayVisualization', () =>
{
    it('picks the frame from the elapsed time, looping', () =>
    {
        const delays = [ 100, 50, 200 ];

        expect(FurnitureBadgeDisplayVisualization.frameAt(delays, 0)).toBe(0);
        expect(FurnitureBadgeDisplayVisualization.frameAt(delays, 120)).toBe(1);
        expect(FurnitureBadgeDisplayVisualization.frameAt(delays, 151)).toBe(2);
        expect(FurnitureBadgeDisplayVisualization.frameAt(delays, 350)).toBe(0);
        expect(FurnitureBadgeDisplayVisualization.frameAt([], 500)).toBe(0);
    });

    it('fetches and decodes a badge once for every display', async () =>
    {
        const fetchMock = vi.fn(async () => ({ ok: false }));
        vi.stubGlobal('fetch', fetchMock);

        const first = FurnitureBadgeDisplayVisualization.decodeBadge('ONCE01');
        const second = FurnitureBadgeDisplayVisualization.decodeBadge('ONCE01');

        expect(second).toBe(first);
        expect(await first).toBeNull();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('shows a private copy and never touches the shared badge texture', async () =>
    {
        vi.stubGlobal('fetch', vi.fn(async () => ({ ok: false })));
        const shared = sharedBadge();
        badgeImage.current = shared;
        const { visualization, asset } = display();
        const resource = shared.source.resource;

        await visualization.addBadgeToAssetCollection('COPY01');

        expect(shared.source.resource).toBe(resource);
        expect(asset.addAsset).toHaveBeenCalledTimes(1);
        const [ name, texture ] = asset.addAsset.mock.calls[0] as unknown[];
        expect(name).toBe('COPY01_display_7');
        expect(texture).not.toBe(shared);
    });

    it('drops a decode that finishes after the display is gone', async () =>
    {
        let finish: (value: unknown) => void;
        vi.stubGlobal('fetch', vi.fn(() => new Promise(resolve => (finish = resolve))));
        badgeImage.current = sharedBadge();
        const { visualization, asset } = display();

        const pending = visualization.addBadgeToAssetCollection('GONE01');
        visualization._disposed = true;
        visualization.releaseBadge();

        expect(asset.disposeAsset).toHaveBeenCalledWith('GONE01_display_7');

        finish({ ok: true, arrayBuffer: async () => new ArrayBuffer(4) });
        await pending;

        expect(visualization._decoded).toBeNull();
        expect(asset.addAsset).toHaveBeenCalledTimes(1);
    });
});
