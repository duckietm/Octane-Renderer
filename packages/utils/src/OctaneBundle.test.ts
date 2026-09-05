import { deflate } from 'pako';
import { Texture } from 'pixi.js';
import { describe, expect, it, vi } from 'vitest';
import { OctaneBundle } from './OctaneBundle';

interface BundleEntry
{
    name: string;
    bytes: Uint8Array;
}

const createBundle = (entries: BundleEntry[]): ArrayBuffer =>
{
    const encoded = entries.map(entry => ({
        name: new TextEncoder().encode(entry.name),
        payload: deflate(entry.bytes)
    }));
    const size = 2 + encoded.reduce((total, entry) => total + 2 + entry.name.length + 4 + entry.payload.length, 0);
    const bytes = new Uint8Array(size);
    const view = new DataView(bytes.buffer);
    let offset = 0;

    view.setInt16(offset, encoded.length);
    offset += 2;

    for(const entry of encoded)
    {
        view.setInt16(offset, entry.name.length);
        offset += 2;
        bytes.set(entry.name, offset);
        offset += entry.name.length;
        view.setInt32(offset, entry.payload.length);
        offset += 4;
        bytes.set(entry.payload, offset);
        offset += entry.payload.length;
    }

    return bytes.buffer;
};

describe('OctaneBundle image decoding', () =>
{
    it('passes the inflated image bytes and entry name to a custom decoder', async () =>
    {
        const imageBytes = new Uint8Array([ 0x52, 0x49, 0x46, 0x46, 0, 0, 0, 0, 0x57, 0x45, 0x42, 0x50 ]);
        const texture = { label: '' } as Texture;
        const decodeTexture = vi.fn().mockResolvedValue(texture);
        const buffer = createBundle([
            { name: 'chair.json', bytes: new TextEncoder().encode('{"name":"chair"}') },
            { name: 'chair.webp', bytes: imageBytes }
        ]);

        const bundle = await OctaneBundle.from(buffer, decodeTexture);

        expect(decodeTexture).toHaveBeenCalledOnce();
        expect(new Uint8Array(decodeTexture.mock.calls[0][0])).toEqual(imageBytes);
        expect(decodeTexture).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'chair.webp');
        expect(bundle.texture).toBe(texture);
        expect(bundle.jsonFile).toEqual({ name: 'chair' });
    });
});
