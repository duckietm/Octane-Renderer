export const HANDSHAKE_MAGIC = 0xC0DEC0DE | 0;
export const TYPE_SERVER_HELLO = 0x01;
export const TYPE_CLIENT_HELLO = 0x02;
export const HKDF_INFO = 'nitro-ws-v1';
export const AES_KEY_BITS = 256;
export const NONCE_LEN = 12;
export const GCM_TAG_LEN = 16;

export async function generateEphemeralKeyPair(): Promise<CryptoKeyPair>
{
    return window.crypto.subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, [ 'deriveBits' ]);
}

export async function exportPublicKeySpki(publicKey: CryptoKey): Promise<ArrayBuffer>
{
    return window.crypto.subtle.exportKey('spki', publicKey);
}

export async function importPublicKeySpki(spki: ArrayBuffer): Promise<CryptoKey>
{
    return window.crypto.subtle.importKey('spki', spki, { name: 'ECDH', namedCurve: 'P-256' }, false, []);
}

export async function deriveSharedSecret(ourPrivate: CryptoKey, theirPublic: CryptoKey): Promise<ArrayBuffer>
{
    return window.crypto.subtle.deriveBits({ name: 'ECDH', public: theirPublic }, ourPrivate, 256);
}

export async function deriveAesKey(sharedSecret: ArrayBuffer): Promise<CryptoKey>
{
    const ikm = await window.crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, [ 'deriveKey' ]);
    return window.crypto.subtle.deriveKey(
        { name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info: new TextEncoder().encode(HKDF_INFO) },
        ikm,
        { name: 'AES-GCM', length: AES_KEY_BITS },
        false,
        [ 'encrypt', 'decrypt' ]
    );
}

export async function aesGcmEncrypt(key: CryptoKey, nonce: Uint8Array<ArrayBuffer>, plaintext: ArrayBuffer): Promise<ArrayBuffer>
{
    return window.crypto.subtle.encrypt({ name: 'AES-GCM', iv: nonce, tagLength: GCM_TAG_LEN * 8 }, key, plaintext);
}

export async function aesGcmDecrypt(key: CryptoKey, nonce: Uint8Array<ArrayBuffer>, ciphertextWithTag: ArrayBuffer): Promise<ArrayBuffer>
{
    return window.crypto.subtle.decrypt({ name: 'AES-GCM', iv: nonce, tagLength: GCM_TAG_LEN * 8 }, key, ciphertextWithTag);
}

export function randomNonce(): Uint8Array<ArrayBuffer>
{
    const n = new Uint8Array(NONCE_LEN);
    window.crypto.getRandomValues(n);
    return n;
}

export function buildClientHello(pubkeySpki: ArrayBuffer): ArrayBuffer
{
    const out = new Uint8Array(4 + 1 + 2 + pubkeySpki.byteLength);
    const dv = new DataView(out.buffer);
    dv.setUint32(0, HANDSHAKE_MAGIC, false);
    out[4] = TYPE_CLIENT_HELLO;
    dv.setUint16(5, pubkeySpki.byteLength, false);
    out.set(new Uint8Array(pubkeySpki), 7);
    return out.buffer;
}

export interface ParsedServerHello
{
    pubkeySpki: ArrayBuffer;
    signature: ArrayBuffer | null;
}

export function parseServerHello(frame: ArrayBuffer): ParsedServerHello
{
    if(frame.byteLength < 7) throw new Error('server_hello frame too short');
    const dv = new DataView(frame);
    const magic = dv.getUint32(0, false);
    if(magic >>> 0 !== (HANDSHAKE_MAGIC >>> 0)) throw new Error('server_hello magic mismatch');
    const type = dv.getUint8(4);
    if(type !== TYPE_SERVER_HELLO) throw new Error(`expected server_hello, got type=0x${ type.toString(16) }`);

    const keyLen = dv.getUint16(5, false);
    if(keyLen <= 0 || keyLen > frame.byteLength - 7) throw new Error(`invalid server key length ${ keyLen }`);
    const pubkeySpki = frame.slice(7, 7 + keyLen);

    const remaining = frame.byteLength - (7 + keyLen);
    if(remaining === 0) return { pubkeySpki, signature: null };
    if(remaining < 2) throw new Error('truncated signature trailer');
    const sigLen = dv.getUint16(7 + keyLen, false);
    if(sigLen <= 0 || 7 + keyLen + 2 + sigLen !== frame.byteLength) throw new Error(`invalid signature length ${ sigLen }`);
    const signature = frame.slice(7 + keyLen + 2, 7 + keyLen + 2 + sigLen);
    return { pubkeySpki, signature };
}

export async function importSigningPublicKeyFromBase64(spkiBase64: string): Promise<CryptoKey>
{
    const bin = atob(spkiBase64.replace(/-/g, '+').replace(/_/g, '/'));
    const bytes = new Uint8Array(bin.length);
    for(let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return window.crypto.subtle.importKey(
        'spki',
        bytes.buffer,
        { name: 'ECDSA', namedCurve: 'P-256' },
        false,
        [ 'verify' ]
    );
}

export async function verifyEphemeralSignature(signingKey: CryptoKey, signature: ArrayBuffer, signedBytes: ArrayBuffer): Promise<boolean>
{
    return window.crypto.subtle.verify(
        { name: 'ECDSA', hash: 'SHA-256' },
        signingKey,
        signature,
        signedBytes
    );
}

/**
 * Version 2 of the encrypted channel, asked for as this WebSocket subprotocol. Version 1 used one key both ways and a
 * random nonce, so a frame could be replayed, reordered or sent back to its author. Version 2 derives a key per
 * direction, bound to both handshake keys, and every nonce is the direction plus a 64-bit counter that the receiver
 * checks. A server that does not answer the subprotocol keeps version 1.
 */
export const SUBPROTOCOL_V2 = 'octane-ws-v2';
export const DIRECTION_CLIENT_TO_SERVER = 1;
export const DIRECTION_SERVER_TO_CLIENT = 2;

export interface DirectionalKeys
{
    send: CryptoKey;
    receive: CryptoKey;
}

const concatBytes = (...parts: ArrayBuffer[]): Uint8Array<ArrayBuffer> =>
{
    const out = new Uint8Array(parts.reduce((total, part) => total + part.byteLength, 0));
    let offset = 0;

    for(const part of parts)
    {
        out.set(new Uint8Array(part), offset);
        offset += part.byteLength;
    }

    return out;
};

/** The raw key of one direction: HKDF-SHA-256 with the label and the hash of both handshake public keys as info. */
export async function deriveDirectionalKeyBits(sharedSecret: ArrayBuffer, label: string, serverSpki: ArrayBuffer, clientSpki: ArrayBuffer): Promise<ArrayBuffer>
{
    const transcript = await window.crypto.subtle.digest('SHA-256', concatBytes(serverSpki, clientSpki));
    const info = concatBytes(new TextEncoder().encode(label).buffer as ArrayBuffer, transcript);
    const ikm = await window.crypto.subtle.importKey('raw', sharedSecret, 'HKDF', false, [ 'deriveBits' ]);

    return window.crypto.subtle.deriveBits({ name: 'HKDF', hash: 'SHA-256', salt: new Uint8Array(32), info }, ikm, AES_KEY_BITS);
}

export async function deriveDirectionalKeys(sharedSecret: ArrayBuffer, serverSpki: ArrayBuffer, clientSpki: ArrayBuffer): Promise<DirectionalKeys>
{
    const importKey = async (label: string) => window.crypto.subtle.importKey(
        'raw', await deriveDirectionalKeyBits(sharedSecret, label, serverSpki, clientSpki), { name: 'AES-GCM' }, false, [ 'encrypt', 'decrypt' ]);

    return { send: await importKey('octane-ws-v2 c2s'), receive: await importKey('octane-ws-v2 s2c') };
}

export function directionalNonce(direction: number, counter: number): Uint8Array<ArrayBuffer>
{
    const nonce = new Uint8Array(NONCE_LEN);
    const view = new DataView(nonce.buffer);

    view.setUint32(0, direction, false);
    view.setBigUint64(4, BigInt(counter), false);

    return nonce;
}

export function readDirectionalNonce(nonce: Uint8Array): { direction: number, counter: number }
{
    const view = new DataView(nonce.buffer, nonce.byteOffset, nonce.byteLength);

    return { direction: view.getUint32(0, false), counter: Number(view.getBigUint64(4, false)) };
}
