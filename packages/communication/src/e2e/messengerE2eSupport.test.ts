import { IConnection } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { detachAuthenticatedConnection, formatMessengerDiagnostics } from './messengerE2eSupport';

describe('Messenger E2E support', () =>
{
    it('readies the connection before detaching manager listeners', () =>
    {
        const order: string[] = [];
        const connection = { ready: () => order.push('ready') } as unknown as IConnection;
        const manager = { connection, dispose: () => order.push('dispose') };

        expect(detachAuthenticatedConnection(manager)).toBe(connection);
        expect(order).toEqual([ 'ready', 'dispose' ]);
    });

    it('prints the client label and ordered event timeline', () =>
    {
        expect(formatMessengerDiagnostics('B', [ 'connected', 'message:42' ]))
            .toBe('B timeline=["connected","message:42"]');
    });
});
