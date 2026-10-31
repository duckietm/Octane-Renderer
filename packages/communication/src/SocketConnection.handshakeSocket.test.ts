import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('SocketConnection crypto handshake', () =>
{
    it('installs the key and answers only on the socket that started the handshake', () =>
    {
        const source = readFileSync(join(__dirname, 'SocketConnection.ts'), 'utf8');
        const start = source.indexOf('private async handleServerHello');
        const body = source.slice(start, source.indexOf('private queueEncryptedSend', start));

        expect(body).toContain('const socket = this._socket;');
        expect(body).toContain('if(this._socket !== socket) return;');
        expect(body.indexOf('if(this._socket !== socket) return;')).toBeLessThan(body.indexOf('this._sessionKey = sessionKey;'));
        expect(body).toContain('socket.send(buildClientHello(ourPubkeySpki));');
    });
});
