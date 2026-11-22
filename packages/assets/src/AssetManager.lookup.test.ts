import { expect, it, vi } from 'vitest';
import { Texture } from 'pixi.js';
import { AssetManager } from './AssetManager';

it('finds hits and misses without scanning unrelated clothing libraries', () =>
{
    const manager = new AssetManager();
    const unrelated = Array.from({ length: 3000 }, (_, index) => manager.createCollection({ name: `library-${index}` }, null));
    const scans = unrelated.map(collection => vi.spyOn(collection, 'getAsset'));
    const target = manager.createCollection({ name: 'target' }, null);
    target.addAsset('head', Texture.WHITE, false);
    const expected = target.getAsset('head');
    for(let i = 0; i < 1000; i++)
    {
        expect(manager.getAsset('head')).toBe(expected);
        expect(manager.getAsset(`missing-${i}`)).toBeNull();
    }
    expect(scans.every(scan => scan.mock.calls.length === 0)).toBe(true);
});

it('tracks additions, disposal, replacement and duplicate precedence without stale pooled assets', () =>
{
    const manager = new AssetManager();
    const first = manager.createCollection({ name: 'first' }, null);
    const second = manager.createCollection({ name: 'second' }, null);
    expect(manager.getAsset('head')).toBeNull();
    second.addAsset('head', Texture.WHITE, false);
    expect(manager.getAsset('head')).toBe(second.getAsset('head'));
    first.addAsset('head', Texture.WHITE, false);
    expect(manager.getAsset('head')).toBe(first.getAsset('head'));
    first.dispose();
    expect(manager.getAsset('head')).toBe(second.getAsset('head'));
    const replacement = manager.createCollection({ name: 'first' }, null);
    replacement.addAsset('head', Texture.WHITE, false);
    expect(manager.getAsset('head')).toBe(replacement.getAsset('head'));
    first.dispose();
    expect(manager.getAsset('head')).toBe(replacement.getAsset('head'));
    replacement.dispose();
    second.dispose();
    expect(manager.getAsset('head')).toBeNull();
});

it('keeps separate managers independent', () =>
{
    const a = new AssetManager(), b = new AssetManager();
    a.createCollection({ name: 'same' }, null).addAsset('head', Texture.WHITE, false);
    const other = b.createCollection({ name: 'same' }, null);
    other.addAsset('other', Texture.WHITE, false);
    expect(a.getAsset('other')).toBeNull();
    expect(b.getAsset('head')).toBeNull();
    expect(b.getAsset('other')).toBe(other.getAsset('other'));
});
