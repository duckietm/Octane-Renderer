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

    it('reads a text atlas entry instead of sending it to the image decoder', async () =>
    {
        const texture = { label: '' } as Texture;
        const decodeTexture = vi.fn().mockResolvedValue(texture);
        const buffer = createBundle([
            { name: 'face.atlas', bytes: new TextEncoder().encode('face.png\nsize: 4,4\n') },
            { name: 'face.json', bytes: new TextEncoder().encode('{"name":"face"}') },
            { name: 'face.png', bytes: new Uint8Array([ 0x89, 0x50, 0x4e, 0x47 ]) }
        ]);

        const bundle = await OctaneBundle.from(buffer, decodeTexture);

        expect(decodeTexture).toHaveBeenCalledOnce();
        expect(decodeTexture).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'face.png');
        expect(bundle.texture).toBe(texture);
        expect(bundle.jsonFile).toEqual({ name: 'face' });
        expect(bundle.atlasFile).toBe('face.png\nsize: 4,4\n');
    });

    it('hands the decoder the entry bytes as their own buffer, with nothing else attached', async () =>
    {
        // The reader inflates into a buffer of its own; the decoder must see exactly the entry,
        // never a view onto a larger one it would have to be told the bounds of.
        const imageBytes = new Uint8Array([ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ]);
        const buffer = createBundle([
            { name: 'sheet.json', bytes: new TextEncoder().encode('{"a":1}') },
            { name: 'sheet.png', bytes: imageBytes }
        ]);
        const decodeTexture = vi.fn().mockResolvedValue({} as Texture);

        await OctaneBundle.from(buffer, decodeTexture);

        const decoded = decodeTexture.mock.calls[0][0] as ArrayBuffer;

        expect(decoded.byteLength).toBe(imageBytes.length);
        expect(new Uint8Array(decoded)).toEqual(imageBytes);
    });
});

describe('OctaneBundle .hab', () =>
{
    const createHab = (entries: { name: string; mimeType: string; bytes: Uint8Array }[], name = 'chair'): ArrayBuffer =>
    {
        const payloads: Uint8Array[] = [];
        const indexEntries = [];
        let offset = 0;

        for(const entry of entries)
        {
            const stored = deflate(entry.bytes);

            indexEntries.push({ name: entry.name, mimeType: entry.mimeType, offset, storedLength: stored.length, originalLength: entry.bytes.length, compression: 'deflate' });
            payloads.push(stored);
            offset += stored.length;
        }

        const indexRaw = new TextEncoder().encode(JSON.stringify({ format: 'hab', version: 1, name, entries: indexEntries }));
        const index = deflate(indexRaw);
        const bytes = new Uint8Array(20 + index.length + offset);
        const view = new DataView(bytes.buffer);

        bytes.set([ 0x48, 0x41, 0x42, 0 ], 0);
        view.setUint16(4, 1, true);
        view.setUint16(6, 1, true);
        view.setUint32(8, index.length, true);
        view.setUint32(12, indexRaw.length, true);
        view.setUint32(16, offset, true);
        bytes.set(index, 20);

        let position = 20 + index.length;

        for(const payload of payloads)
        {
            bytes.set(payload, position);
            position += payload.length;
        }

        return bytes.buffer;
    };

    it('reads the json and the sheet of a .hab like a .nitro', async () =>
    {
        const png = new Uint8Array([ 0x89, 0x50, 0x4e, 0x47, 1, 2, 3 ]);
        const texture = Texture.EMPTY;
        const decoder = vi.fn(async (_bytes: ArrayBuffer, _entryName: string) => texture);
        const buffer = createHab([
            { name: 'chair.json', mimeType: 'application/json', bytes: new TextEncoder().encode('{"name":"chair"}') },
            { name: 'chair.png', mimeType: 'image/png', bytes: png }
        ]);

        const bundle = await OctaneBundle.from(buffer, decoder);

        expect(bundle.jsonFile).toEqual({ name: 'chair' });
        expect(bundle.texture).toBe(texture);
        expect(decoder).toHaveBeenCalledWith(expect.any(ArrayBuffer), 'chair.png');
        expect(new Uint8Array(decoder.mock.calls[0][0])).toEqual(png);
    });

    it('names a Habbo clothes library from documentClass when its json has no name', async () =>
    {
        const json = '{"documentClass":"hh_human_shirt","assets":{},"spritesheet":{}}';
        const buffer = createHab([
            { name: 'hh_human_shirt.json', mimeType: 'application/json', bytes: new TextEncoder().encode(json) },
            { name: 'hh_human_shirt.webp', mimeType: 'image/webp', bytes: new Uint8Array([ 1 ]) }
        ], 'hh_human_shirt');

        const bundle = await OctaneBundle.from(buffer, vi.fn(async () => Texture.EMPTY));

        expect(bundle.jsonFile).toMatchObject({ name: 'hh_human_shirt', documentClass: 'hh_human_shirt' });
    });

    it('falls back to the bundle name when the json has neither name nor documentClass', async () =>
    {
        const buffer = createHab([ { name: 'x.json', mimeType: 'application/json', bytes: new TextEncoder().encode('{}') } ], 'hh_human_leg');

        const bundle = await OctaneBundle.from(buffer, vi.fn());

        expect(bundle.jsonFile).toEqual({ name: 'hh_human_leg' });
    });

    it('refuses a flash-style .hab (xml and loose images) with a clear message', async () =>
    {
        const buffer = createHab([
            { name: 'index', mimeType: 'text/xml', bytes: new TextEncoder().encode('<index/>') },
            { name: 'chair_64_a_0_0', mimeType: 'image/png', bytes: new Uint8Array([ 1 ]) },
            { name: 'chair_64_b_0_0', mimeType: 'image/png', bytes: new Uint8Array([ 2 ]) }
        ]);

        await expect(OctaneBundle.from(buffer, vi.fn())).rejects.toThrow(/flash-style/);
    });

    it('fails loudly on a damaged .hab', async () =>
    {
        const buffer = createHab([ { name: 'chair.json', mimeType: 'application/json', bytes: new TextEncoder().encode('{}') } ]);
        const damaged = buffer.slice(0, buffer.byteLength - 2);

        await expect(OctaneBundle.from(damaged, vi.fn())).rejects.toThrow(/shorter/);
    });
});
