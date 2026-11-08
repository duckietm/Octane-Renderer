import { describe, expect, it, vi } from 'vitest';
import { Texture } from 'pixi.js';
import { AssetManager } from './AssetManager';

const createResource = () => ({ texture: new Texture(), format: 'png' as const, animated: false, dispose: vi.fn() });

const createManager = () =>
{
    const resources: ReturnType<typeof createResource>[] = [];
    const manager = new AssetManager({
        fetch: vi.fn().mockResolvedValue({ ok: true, status: 200 }),
        parseAssetData: vi.fn().mockResolvedValue({ name: 'chair' }),
        loadImageResource: vi.fn().mockImplementation(async () =>
        {
            const resource = createResource();

            resources.push(resource);

            return resource;
        }),
        loadOctaneBundle: vi.fn()
    });

    return { manager, resources };
};

// A library downloaded again under another url (a new revision) replaced the collection but kept the old sheet loaded.
describe('AssetManager collection replacement', () =>
{
    it('frees the sheet of a collection replaced by one of the same name', async () =>
    {
        const { manager, resources } = createManager();

        await manager.downloadAsset('https://cdn.example/chair.json?v=1');
        await manager.downloadAsset('https://cdn.example/chair.json?v=2');

        expect(resources).toHaveLength(2);
        expect(resources[0].dispose).toHaveBeenCalledOnce();
        expect(resources[1].dispose).not.toHaveBeenCalled();
        expect(manager.getTexture('https://cdn.example/chair.json?v=1')).toBeUndefined();
        expect(manager.getTexture('https://cdn.example/chair.json?v=2')).toBe(resources[1].texture);
    });

    it('frees the old sheet once when the same url is downloaded again', async () =>
    {
        const { manager, resources } = createManager();

        await manager.downloadAsset('https://cdn.example/chair.json');
        await manager.downloadAsset('https://cdn.example/chair.json');

        expect(resources[0].dispose).toHaveBeenCalledOnce();
        expect(resources[1].dispose).not.toHaveBeenCalled();
        expect(manager.getTexture('https://cdn.example/chair.json')).toBe(resources[1].texture);
    });

    it('unregisters the texture names only the replaced collection held', () =>
    {
        const manager = new AssetManager();
        const old = manager.createCollection({ name: 'chair' }, null);
        const kept = new Texture();
        const stale = new Texture();

        old.textures.set('chair_shared', kept);
        old.textures.set('chair_old_only', stale);
        manager.setTexture('chair_shared', kept);
        manager.setTexture('chair_old_only', stale);

        const replacement = manager.createCollection({ name: 'chair' }, null);
        const fresh = new Texture();

        replacement.textures.set('chair_shared', fresh);
        manager.setTexture('chair_shared', fresh);

        expect(manager.getTexture('chair_old_only')).toBeUndefined();
        expect(manager.getTexture('chair_shared')).toBe(fresh);
    });
});
