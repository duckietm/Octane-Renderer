import { describe, expect, it } from 'vitest';
import { aesGcmEncrypt, deriveDirectionalKeys, DIRECTION_CLIENT_TO_SERVER, DIRECTION_SERVER_TO_CLIENT, directionalNonce } from './crypto';
import { SocketConnection } from './SocketConnection';

// Version 2 of the encrypted WebSocket: the client takes only the server's next frame, so a frame replayed, reordered
// or sent back to it is refused instead of being read again.
type Internals = {
    _directional: { keys: { send: CryptoKey, receive: CryptoKey }, sendCounter: number, receiveCounter: number };
    decryptFrame(frame: ArrayBuffer): Promise<ArrayBuffer>;
};

const text = (value: string) => new TextEncoder().encode(value).buffer;

const frame = async (key: CryptoKey, direction: number, counter: number, value: string): Promise<ArrayBuffer> =>
{
    const nonce = directionalNonce(direction, counter);
    const ciphertext = new Uint8Array(await aesGcmEncrypt(key, nonce, text(value)));
    const out = new Uint8Array(nonce.length + ciphertext.length);

    out.set(nonce, 0);
    out.set(ciphertext, nonce.length);

    return out.buffer;
};

const setup = async () =>
{
    const shared = new Uint8Array(32).fill(7).buffer;
    const keys = await deriveDirectionalKeys(shared, text('server-spki'), text('client-spki'));
    const connection = new SocketConnection() as unknown as Internals;

    connection._directional = { keys, sendCounter: 0, receiveCounter: 0 };

    return { connection, keys };
};

describe('SocketConnection encrypted WebSocket v2', () =>
{
    it('reads the server frames in order', async () =>
    {
        const { connection, keys } = await setup();

        expect(new TextDecoder().decode(await connection.decryptFrame(await frame(keys.receive, DIRECTION_SERVER_TO_CLIENT, 0, 'one')))).toBe('one');
        expect(new TextDecoder().decode(await connection.decryptFrame(await frame(keys.receive, DIRECTION_SERVER_TO_CLIENT, 1, 'two')))).toBe('two');
    });

    it('refuses a replayed or skipped frame', async () =>
    {
        const { connection, keys } = await setup();
        const first = await frame(keys.receive, DIRECTION_SERVER_TO_CLIENT, 0, 'one');

        await connection.decryptFrame(first);

        await expect(connection.decryptFrame(first)).rejects.toThrow('expected 1');
        await expect(connection.decryptFrame(await frame(keys.receive, DIRECTION_SERVER_TO_CLIENT, 5, 'late'))).rejects.toThrow('expected 1');
    });

    it('refuses its own frame sent back to it', async () =>
    {
        const { connection, keys } = await setup();

        await expect(connection.decryptFrame(await frame(keys.send, DIRECTION_CLIENT_TO_SERVER, 0, 'mine'))).rejects.toThrow('wrong direction');
    });
});
