import { describe, expect, it } from 'vitest';
import { deriveDirectionalKeyBits, DIRECTION_CLIENT_TO_SERVER, directionalNonce, readDirectionalNonce } from './WsSessionCrypto';

// Version 2 of the encrypted WebSocket: a key per direction bound to both handshake keys, and a counter in every
// nonce. The expected keys were computed independently (Python hmac/hashlib) and Polaris's test checks the same ones.
const hex = (buffer: ArrayBuffer) => [ ...new Uint8Array(buffer) ].map(byte => byte.toString(16).padStart(2, '0')).join('');
const ascii = (text: string) => new TextEncoder().encode(text).buffer as ArrayBuffer;
const shared = new Uint8Array(Array.from({ length: 32 }, (_, i) => i + 1)).buffer;

describe('encrypted WebSocket v2 keys and nonces', () =>
{
    it('derives the same key per direction as the server', async () =>
    {
        const serverSpki = ascii('server-spki');
        const clientSpki = ascii('client-spki');

        expect(hex(await deriveDirectionalKeyBits(shared, 'octane-ws-v2 c2s', serverSpki, clientSpki)))
            .toBe('74ada030b255155d0698f6ab4b4add8f0866bc8c2c6a82d4f735126fef242721');
        expect(hex(await deriveDirectionalKeyBits(shared, 'octane-ws-v2 s2c', serverSpki, clientSpki)))
            .toBe('c97264796dd38c46c38dbfb2a64b50ec9c3fd86dbf3028efb969faf4ce6080dd');
    });

    it('writes the direction and the counter into the nonce, as the server reads them', () =>
    {
        const nonce = directionalNonce(DIRECTION_CLIENT_TO_SERVER, 300);

        expect(hex(nonce.buffer)).toBe('00000001000000000000012c');
        expect(readDirectionalNonce(nonce)).toEqual({ direction: 1, counter: 300 });
    });
});
