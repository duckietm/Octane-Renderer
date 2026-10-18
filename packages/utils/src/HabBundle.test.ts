import { deflate } from 'pako';
import { describe, expect, it } from 'vitest';
import { readHabBundle } from './HabBundle';

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
