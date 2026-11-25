import { deflate, deflateRaw } from 'pako';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { HAB_NATIVE_INFLATE_MIN_BYTES, readHabBundle, readHabBundleAsync } from './HabBundle';

const buildHab = (index: object, data: Uint8Array, version: number = 1): ArrayBuffer =>
{
    const rawIndex = new TextEncoder().encode(JSON.stringify(index));
    const packedIndex = deflate(rawIndex);
    const buffer = new ArrayBuffer(20 + packedIndex.byteLength + data.byteLength);
    const view = new DataView(buffer);
    const bytes = new Uint8Array(buffer);

    bytes.set([ 0x48, 0x41, 0x42, 0 ], 0);
    view.setUint16(4, version, true);
    view.setUint16(6, 1, true);
    view.setUint32(8, packedIndex.byteLength, true);
    view.setUint32(12, rawIndex.byteLength, true);
    view.setUint32(16, data.byteLength, true);
    bytes.set(packedIndex, 20);
    bytes.set(data, 20 + packedIndex.byteLength);

    return buffer;
};

const DATA = new Uint8Array([ 1, 2, 3, 4 ]);
const entry = (name: string, extra: object = {}) => ({ name, mimeType: 'application/octet-stream', offset: 0, storedLength: 4, originalLength: 4, compression: 'none', ...extra });

describe('readHabBundle', () =>
{
    it('reads stored entries', () =>
    {
        const contents = readHabBundle(buildHab({ format: 'hab', version: 1, name: 'chair', entries: [ entry('chair.bin') ] }, DATA));

        expect(contents.name).toBe('chair');
        expect(Array.from(contents.entries[0].bytes)).toEqual([ 1, 2, 3, 4 ]);
    });

    it('rejects another format version', () =>
    {
        expect(() => readHabBundle(buildHab({ format: 'hab', version: 1, entries: [] }, DATA, 2))).toThrow(/version 2/);
    });

    it('rejects an entry listed twice', () =>
    {
        expect(() => readHabBundle(buildHab({ format: 'hab', version: 1, entries: [ entry('a.bin'), entry('a.bin') ] }, DATA))).toThrow(/listed twice/);
    });

    it('rejects unknown compression', () =>
    {
        expect(() => readHabBundle(buildHab({ format: 'hab', version: 1, entries: [ entry('a.bin', { compression: 'lzma' }) ] }, DATA))).toThrow(/unknown compression/);
    });

    it('rejects an entry outside the data section', () =>
    {
        expect(() => readHabBundle(buildHab({ format: 'hab', version: 1, entries: [ entry('a.bin', { offset: 2 }) ] }, DATA))).toThrow(/outside/);
    });
});

describe('readHabBundleAsync', () =>
{
    // Pseudo-random bytes, so they stay above the native inflate threshold once compressed.
    let seed = 12345;
    const original = new Uint8Array(HAB_NATIVE_INFLATE_MIN_BYTES * 2).map(() => (seed = (seed * 1103515245 + 12345) >>> 0) >>> 24);
    const NativeDecompressionStream = globalThis.DecompressionStream;
    let nativeStreams = 0;

    const countNativeStreams = (): void =>
    {
        nativeStreams = 0;

        vi.stubGlobal('DecompressionStream', class extends NativeDecompressionStream
        {
            constructor(format: CompressionFormat)
            {
                super(format);
                nativeStreams++;
            }
        });
    };

    afterEach(() => vi.unstubAllGlobals());

    const compressedBundle = (packed: Uint8Array): ArrayBuffer =>
    {
        const small = deflate(DATA);
        const data = new Uint8Array(packed.byteLength + small.byteLength);

        data.set(packed, 0);
        data.set(small, packed.byteLength);

        return buildHab({ format: 'hab', version: 1, name: 'bundle', entries: [
            { name: 'big.png', mimeType: 'image/png', offset: 0, storedLength: packed.byteLength, originalLength: original.byteLength, compression: 'deflate' },
            { name: 'small.json', mimeType: 'application/json', offset: packed.byteLength, storedLength: small.byteLength, originalLength: DATA.byteLength, compression: 'deflate' }
        ] }, data);
    };

    it('reads the same entries as the synchronous reader, in index order', async () =>
    {
        const packed = deflate(original);

        expect(packed.byteLength).toBeGreaterThanOrEqual(HAB_NATIVE_INFLATE_MIN_BYTES);

        const buffer = compressedBundle(packed);

        countNativeStreams();

        const contents = await readHabBundleAsync(buffer);

        // Only the large entry goes through the browser's stream; the small one stays with pako.
        expect(nativeStreams).toBe(1);

        expect(contents).toEqual(readHabBundle(buffer));
        expect(contents.entries.map(entry => entry.name)).toEqual([ 'big.png', 'small.json' ]);
        expect(contents.entries[0].bytes).toEqual(original);
        expect(Array.from(contents.entries[1].bytes)).toEqual([ 1, 2, 3, 4 ]);
    });

    it('still reads a raw deflate entry, which the native zlib stream refuses', async () =>
    {
        const contents = await readHabBundleAsync(compressedBundle(deflateRaw(original)));

        expect(contents.entries[0].bytes).toEqual(original);
    });

    it('fails on a damaged bundle like the synchronous reader', async () =>
    {
        await expect(readHabBundleAsync(buildHab({ format: 'hab', version: 1, entries: [ entry('a.bin', { offset: 2 }) ] }, DATA))).rejects.toThrow(/outside/);
        await expect(readHabBundleAsync(buildHab({ format: 'hab', version: 1, entries: [ entry('a.bin', { originalLength: 5 }) ] }, DATA))).rejects.toThrow(/wrong length/);
    });
});
