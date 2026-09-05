import { DetectedImageFormat, ImageFormat } from './ImageFormat';

const MIME_BY_FORMAT: Record<Exclude<ImageFormat, 'unknown'>, string> = {
    png: 'image/png',
    jpeg: 'image/jpeg',
    gif: 'image/gif',
    webp: 'image/webp',
    avif: 'image/avif',
    svg: 'image/svg+xml',
    bmp: 'image/bmp'
};

const FORMAT_BY_MIME = new Map<string, Exclude<ImageFormat, 'unknown'>>([
    [ 'image/png', 'png' ],
    [ 'image/apng', 'png' ],
    [ 'image/jpeg', 'jpeg' ],
    [ 'image/jpg', 'jpeg' ],
    [ 'image/gif', 'gif' ],
    [ 'image/webp', 'webp' ],
    [ 'image/avif', 'avif' ],
    [ 'image/svg+xml', 'svg' ],
    [ 'image/bmp', 'bmp' ],
    [ 'image/x-bmp', 'bmp' ],
    [ 'image/x-ms-bmp', 'bmp' ]
]);

const FORMAT_BY_EXTENSION = new Map<string, Exclude<ImageFormat, 'unknown'>>([
    [ 'png', 'png' ],
    [ 'apng', 'png' ],
    [ 'jpg', 'jpeg' ],
    [ 'jpeg', 'jpeg' ],
    [ 'jfif', 'jpeg' ],
    [ 'gif', 'gif' ],
    [ 'webp', 'webp' ],
    [ 'avif', 'avif' ],
    [ 'svg', 'svg' ],
    [ 'bmp', 'bmp' ],
    [ 'dib', 'bmp' ]
]);

export const normalizedSourceExtension = (sourceName?: string): string =>
{
    if(!sourceName) return '';

    let pathname: string;

    try
    {
        pathname = new URL(sourceName, 'https://octane.invalid/').pathname;
    }
    catch
    {
        pathname = sourceName.split(/[?#]/, 1)[0];
    }

    const fileName = pathname.replace(/\\/g, '/').split('/').pop() ?? '';
    const extensionIndex = fileName.lastIndexOf('.');

    if(extensionIndex < 0 || extensionIndex === fileName.length - 1) return '';

    return fileName.substring(extensionIndex + 1).toLowerCase();
};

export const detectImageFormat = (bytes: Uint8Array, contentType?: string, sourceName?: string): DetectedImageFormat =>
{
    const payload = bytes ?? new Uint8Array();
    const detectedFromBytes = detectFromBytes(payload);

    if(detectedFromBytes) return detectedFromBytes;

    const normalizedMime = normalizeMime(contentType);
    const formatFromMime = FORMAT_BY_MIME.get(normalizedMime);

    if(formatFromMime) return result(formatFromMime, normalizedMime === 'image/apng');

    const formatFromExtension = FORMAT_BY_EXTENSION.get(normalizedSourceExtension(sourceName));

    if(formatFromExtension) return result(formatFromExtension, false);

    return { format: 'unknown', mimeType: normalizedMime || 'application/octet-stream', animated: false };
};

const detectFromBytes = (bytes: Uint8Array): DetectedImageFormat | null =>
{
    if(startsWith(bytes, [ 0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a ]))
        return result('png', containsAscii(bytes, 'acTL'));

    if(startsWithAscii(bytes, 'GIF87a') || startsWithAscii(bytes, 'GIF89a')) return result('gif', isAnimatedGif(bytes));

    if(startsWithAscii(bytes, 'RIFF') && asciiAt(bytes, 8, 'WEBP'))
        return result('webp', containsAscii(bytes, 'ANIM'));

    if(startsWith(bytes, [ 0xff, 0xd8, 0xff ])) return result('jpeg', false);

    if(isAvif(bytes)) return result('avif', false);

    if(isSvg(bytes)) return result('svg', false);

    if(startsWithAscii(bytes, 'BM')) return result('bmp', false);

    return null;
};

const result = (format: Exclude<ImageFormat, 'unknown'>, animated: boolean): DetectedImageFormat => ({
    format,
    mimeType: MIME_BY_FORMAT[format],
    animated
});

const normalizeMime = (contentType?: string): string => (contentType ?? '').split(';', 1)[0].trim().toLowerCase();

const startsWith = (bytes: Uint8Array, signature: number[]): boolean =>
    signature.length <= bytes.length && signature.every((value, index) => bytes[index] === value);

const startsWithAscii = (bytes: Uint8Array, value: string): boolean => asciiAt(bytes, 0, value);

const asciiAt = (bytes: Uint8Array, offset: number, value: string): boolean =>
{
    if(offset < 0 || offset + value.length > bytes.length) return false;

    for(let index = 0; index < value.length; index++)
    {
        if(bytes[offset + index] !== value.charCodeAt(index)) return false;
    }

    return true;
};

const containsAscii = (bytes: Uint8Array, value: string): boolean =>
{
    for(let offset = 0; offset <= bytes.length - value.length; offset++)
    {
        if(asciiAt(bytes, offset, value)) return true;
    }

    return false;
};

const isAvif = (bytes: Uint8Array): boolean =>
{
    if(bytes.length < 12 || !asciiAt(bytes, 4, 'ftyp')) return false;

    for(let offset = 8; offset + 4 <= bytes.length && offset < 64; offset += 4)
    {
        if(asciiAt(bytes, offset, 'avif') || asciiAt(bytes, offset, 'avis')) return true;
    }

    return false;
};

const isAnimatedGif = (bytes: Uint8Array): boolean =>
{
    if(bytes.length < 13) return false;

    let offset = 13;
    const logicalScreenPacked = bytes[10];

    if(logicalScreenPacked & 0x80) offset += 3 * (1 << ((logicalScreenPacked & 0x07) + 1));

    let frameCount = 0;

    while(offset < bytes.length)
    {
        const blockType = bytes[offset++];

        if(blockType === 0x3b) break;

        if(blockType === 0x21)
        {
            if(offset >= bytes.length) break;

            offset++;
            offset = skipGifSubBlocks(bytes, offset);
            continue;
        }

        if(blockType !== 0x2c || offset + 9 > bytes.length) break;

        const imagePacked = bytes[offset + 8];

        offset += 9;

        if(imagePacked & 0x80) offset += 3 * (1 << ((imagePacked & 0x07) + 1));
        if(offset >= bytes.length) break;

        offset++;
        offset = skipGifSubBlocks(bytes, offset);
        frameCount++;

        if(frameCount > 1) return true;
    }

    return false;
};

const skipGifSubBlocks = (bytes: Uint8Array, start: number): number =>
{
    let offset = start;

    while(offset < bytes.length)
    {
        const length = bytes[offset++];

        if(length === 0) break;

        offset += length;
    }

    return Math.min(offset, bytes.length);
};

const isSvg = (bytes: Uint8Array): boolean =>
{
    if(!bytes.length) return false;

    const sample = new TextDecoder('utf-8', { fatal: false }).decode(bytes.subarray(0, 1024));
    const normalized = sample.replace(/^\uFEFF/, '').trimStart();
    const withoutXmlDeclaration = normalized.replace(/^<\?xml[\s\S]*?\?>\s*/i, '');

    return /^<svg(?:\s|>)/i.test(withoutXmlDeclaration);
};
