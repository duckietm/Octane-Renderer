import { IAssetManager, IGraphicAsset } from '@octane/api';
import { AssetManager } from '@octane/assets';
import { Texture } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AssetAliasCollection } from '../alias';
import { AvatarImageCache } from './AvatarImageCache';

type Resolver = { resolveAsset(assetPartDefinition: string, partType: string, partId: string, direction: number, frameNumber: number): IGraphicAsset };

const setup = (assetManager: IAssetManager = new AssetManager()) =>
{
    const aliases = new AssetAliasCollection(null, assetManager);
    const cache = new AvatarImageCache(null, null, aliases, 'h') as unknown as Resolver;
    const resolve = (partId: string = '1', frame: number = 0) => cache.resolveAsset('std', 'hd', partId, 2, frame);

    return { assetManager, aliases, cache, resolve };
};

describe('AvatarImageCache resolved part assets', () =>
{
    afterEach(() => AvatarImageCache.clearResolvedAssets());

    it('finds an asset of a library that loaded after the miss was cached', () =>
    {
        const { assetManager, resolve } = setup();

        expect(resolve()).toBeNull();
        expect(resolve()).toBeNull();

        const library = assetManager.createCollection({ name: 'hh_human_body' }, null);

        library.addAsset('h_std_hd_1_2_0', Texture.WHITE, false);

        expect(resolve()).toBe(library.getAsset('h_std_hd_1_2_0'));
    });

    it('finds a whole library created after the cache was filled', () =>
    {
        const { assetManager, resolve } = setup();
        const first = assetManager.createCollection({ name: 'first' }, null);

        first.addAsset('h_std_hd_1_2_0', Texture.WHITE, false);

        expect(resolve()).toBe(first.getAsset('h_std_hd_1_2_0'));
        expect(resolve('2')).toBeNull();

        // A library replaced by a reload or a new one with the next part.
        const second = assetManager.createCollection({ name: 'second' }, null);

        second.addAsset('h_std_hd_2_2_0', Texture.WHITE, false);

        expect(resolve('2')).toBe(second.getAsset('h_std_hd_2_2_0'));

        const replacement = assetManager.createCollection({ name: 'first' }, null);

        replacement.addAsset('h_std_hd_1_2_0', Texture.WHITE, false);

        expect(resolve()).toBe(replacement.getAsset('h_std_hd_1_2_0'));
    });

    it('drops an asset whose library was disposed', () =>
    {
        const { assetManager, resolve } = setup();
        const library = assetManager.createCollection({ name: 'lib' }, null);

        library.addAsset('h_std_hd_1_2_0', Texture.WHITE, false);

        expect(resolve()).not.toBeNull();

        library.dispose();

        expect(resolve()).toBeNull();
    });

    it('follows an alias added after the miss was cached', () =>
    {
        const { assetManager, aliases, resolve } = setup();
        const library = assetManager.createCollection({ name: 'lib' }, null);

        library.addAsset('h_std_hd_9_2_0', Texture.WHITE, false);

        expect(resolve()).toBeNull();

        assetManager.createCollection({ name: 'aliases', aliases: { h_std_hd_1_2_0: { link: 'h_std_hd_9_2_0' } } }, null);
        aliases.reset();

        expect(resolve()).toBe(library.getAsset('h_std_hd_9_2_0'));
    });

    it('falls back to the first frame and the default action as before', () =>
    {
        const { assetManager, resolve } = setup();
        const library = assetManager.createCollection({ name: 'lib' }, null);

        library.addAsset('h_std_hd_1_2_0', Texture.WHITE, false);

        expect(resolve('1', 3)).toBe(library.getAsset('h_std_hd_1_2_0'));
    });

    it('looks every asset up again when the asset manager keeps no revision', () =>
    {
        const getAsset = vi.fn((): IGraphicAsset => null);
        const { resolve } = setup({ getAsset, collections: new Map() } as unknown as IAssetManager);

        resolve();
        resolve();

        expect(getAsset).toHaveBeenCalledTimes(8);
    });

    it('keeps the answer while nothing changes', () =>
    {
        const { assetManager, resolve } = setup();
        const getAsset = vi.spyOn(assetManager, 'getAsset');

        resolve();
        resolve();

        expect(getAsset).toHaveBeenCalledTimes(4);
    });
});
