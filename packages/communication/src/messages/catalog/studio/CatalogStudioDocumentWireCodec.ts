import { gzip, ungzip } from 'pako';

export const CATALOG_STUDIO_DOCUMENT_ENCODING = 'GZIP_BASE64_UTF8';
export const CATALOG_STUDIO_DOCUMENT_CHUNK_LENGTH = 32_767;
export const CATALOG_STUDIO_DOCUMENT_MAX_CHUNKS = 256;
export const CATALOG_STUDIO_DOCUMENT_MAX_BYTES = 32 * 1024 * 1024;

export interface CatalogStudioEncodedDocument
{
    encoding: typeof CATALOG_STUDIO_DOCUMENT_ENCODING;
    chunks: string[];
}

const bytesToBase64 = (bytes: Uint8Array): string =>
{
    let binary = '';
    const batchSize = 0x8000;
    for(let offset = 0; offset < bytes.length; offset += batchSize)
        binary += String.fromCharCode(...bytes.subarray(offset, offset + batchSize));
    return btoa(binary);
};

const base64ToBytes = (value: string): Uint8Array =>
{
    const binary = atob(value);
    const bytes = new Uint8Array(binary.length);
    for(let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
    return bytes;
};

export const encodeCatalogStudioDocument = (document: string): CatalogStudioEncodedDocument =>
{
    if(!document.length) return { encoding: CATALOG_STUDIO_DOCUMENT_ENCODING, chunks: [] };

    const documentBytes = new TextEncoder().encode(document);
    if(documentBytes.length > CATALOG_STUDIO_DOCUMENT_MAX_BYTES)
        throw new Error('Catalog Studio SQL document exceeds the decompressed size limit.');
    const encoded = bytesToBase64(gzip(documentBytes));
    const chunks: string[] = [];
    for(let offset = 0; offset < encoded.length; offset += CATALOG_STUDIO_DOCUMENT_CHUNK_LENGTH)
        chunks.push(encoded.slice(offset, offset + CATALOG_STUDIO_DOCUMENT_CHUNK_LENGTH));

    if(chunks.length > CATALOG_STUDIO_DOCUMENT_MAX_CHUNKS)
        throw new Error('Catalog Studio SQL document is too large to transfer safely.');

    return { encoding: CATALOG_STUDIO_DOCUMENT_ENCODING, chunks };
};

export const decodeCatalogStudioDocument = (encoding: string, chunks: string[]): string =>
{
    if(encoding !== CATALOG_STUDIO_DOCUMENT_ENCODING)
        throw new Error(`Unsupported Catalog Studio document encoding: ${encoding}`);
    if(chunks.length > CATALOG_STUDIO_DOCUMENT_MAX_CHUNKS)
        throw new Error('Catalog Studio SQL document contains too many chunks.');
    if(chunks.some(chunk => chunk.length > CATALOG_STUDIO_DOCUMENT_CHUNK_LENGTH))
        throw new Error('Catalog Studio SQL document contains an oversized chunk.');
    if(!chunks.length) return '';

    const documentBytes = ungzip(base64ToBytes(chunks.join('')));
    if(documentBytes.length > CATALOG_STUDIO_DOCUMENT_MAX_BYTES)
        throw new Error('Catalog Studio SQL document exceeds the decompressed size limit.');
    return new TextDecoder('utf-8', { fatal: true }).decode(documentBytes);
};
