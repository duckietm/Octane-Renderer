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
