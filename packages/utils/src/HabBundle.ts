import { inflate, inflateRaw } from 'pako';

/**
 * Habbo's .hab asset bundle (the HTML5 client's replacement for .swf):
 *
 * | offset | size | field                                  |
 * |--------|------|----------------------------------------|
 * | 0      | 4    | magic "HAB\0"                          |
 * | 4      | 2    | version (u16 LE), 1                    |
 * | 6      | 2    | flags (u16 LE)                         |
 * | 8      | 4    | compressed index length (u32 LE)       |
 * | 12     | 4    | uncompressed index length (u32 LE)     |
 * | 16     | 4    | data section length (u32 LE)           |
 * | 20     | ...  | zlib JSON index, then the data section |
 *
 * The index is { format: "hab", version, name, entries: [{ name, mimeType, offset, storedLength,
 * originalLength, compression? }] }; entry offsets count from the start of the data section.
 */
export interface HabBundleEntry
{
    name: string;
    mimeType: string;
    bytes: Uint8Array;
}

export interface HabBundleContents
{
    name: string;
    entries: HabBundleEntry[];
}

interface HabIndexEntry
{
    name: string;
    mimeType?: string;
    offset: number;
    storedLength: number;
    originalLength?: number;
    compression?: string;
}

const HEADER_LENGTH = 20;
const HAB_VERSION = 1;
const MAX_INDEX_LENGTH = (64 * 1024 * 1024);
const MAX_ENTRIES = 100000;
const TEXT_DECODER = new TextDecoder('utf-8');

/** True when the bytes start with the "HAB\0" magic. */
export const isHabBundle = (buffer: ArrayBuffer): boolean =>
{
    if(!buffer || buffer.byteLength < HEADER_LENGTH) return false;

    const magic = new Uint8Array(buffer, 0, 4);

    return magic[0] === 0x48 && magic[1] === 0x41 && magic[2] === 0x42 && magic[3] === 0;
};

/** Reads every entry of a .hab bundle; every length is checked, so a damaged file fails loudly. */
export const readHabBundle = (buffer: ArrayBuffer): HabBundleContents =>
{
    if(!isHabBundle(buffer)) throw new Error('Not a HAB bundle (missing "HAB\\0" magic)');

    const view = new DataView(buffer);
    const version = view.getUint16(4, true);
    const indexLength = view.getUint32(8, true);
    const indexRawLength = view.getUint32(12, true);
    const dataLength = view.getUint32(16, true);
    const dataStart = HEADER_LENGTH + indexLength;

    if(version !== HAB_VERSION) throw new Error(`HAB bundle version ${ version } is not supported`);

    if((indexLength > MAX_INDEX_LENGTH) || (indexRawLength > MAX_INDEX_LENGTH)) throw new Error('HAB index is too large');

    if(dataStart + dataLength > buffer.byteLength) throw new Error('HAB bundle is shorter than its header says');

    const indexBytes = inflate(new Uint8Array(buffer, HEADER_LENGTH, indexLength));

    if(indexRawLength && indexBytes.byteLength !== indexRawLength) throw new Error('HAB index has the wrong length');

    const index = JSON.parse(TEXT_DECODER.decode(indexBytes)) as { format?: string; name?: string; entries?: HabIndexEntry[] };

    if(index?.format !== 'hab' || !Array.isArray(index.entries)) throw new Error('HAB index is not a "hab" index');

    if(index.entries.length > MAX_ENTRIES) throw new Error('HAB index has too many entries');

    const names = new Set<string>();

    const entries: HabBundleEntry[] = index.entries.map(entry =>
    {
        if(typeof entry?.name !== 'string' || names.has(entry.name)) throw new Error(`HAB entry "${ entry?.name }" is missing or listed twice`);

        names.add(entry.name);

        if(!Number.isSafeInteger(entry.offset) || !Number.isSafeInteger(entry.storedLength) || entry.offset < 0 || entry.storedLength < 0 || entry.offset + entry.storedLength > dataLength)
            throw new Error(`HAB entry "${ entry.name }" lies outside the data section`);

        if(entry.compression !== undefined && entry.compression !== 'deflate' && entry.compression !== 'none')
            throw new Error(`HAB entry "${ entry.name }" uses unknown compression "${ entry.compression }"`);

        const stored = new Uint8Array(buffer, dataStart + entry.offset, entry.storedLength);
        const bytes = entry.compression === 'deflate' ? inflateEntry(stored) : stored.slice();

        if(entry.originalLength !== undefined && bytes.byteLength !== entry.originalLength)
            throw new Error(`HAB entry "${ entry.name }" has the wrong length`);

        return { name: entry.name, mimeType: entry.mimeType ?? '', bytes };
    });

    return { name: index.name ?? '', entries };
};

/** Habbo stores zlib streams; a raw deflate stream is accepted too. */
const inflateEntry = (stored: Uint8Array): Uint8Array =>
{
    try
    {
        return inflate(stored);
    }
    catch
    {
        return inflateRaw(stored);
    }
};
