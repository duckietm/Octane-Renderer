import { ConnectionStatePhase, IConnectionStateSnapshot } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { SocketConnection } from './SocketConnection';

describe('authoritative connection state contract', () =>
{
    it('exports every supported lifecycle phase', () =>
    {
        const phases: ConnectionStatePhase[] = [
            'disconnected',
            'connecting',
            'authenticating',
            'connected',
            'reconnecting',
            'reauthenticating',
            'failed'
        ];
        const snapshot: IConnectionStateSnapshot = {
            phase: phases[0],
            reconnectAttempt: 0,
            maxReconnectAttempts: 7,
            authenticated: false,
            closeCode: null,
            closeReason: ''
        };

        expect(phases).toHaveLength(7);
        expect(snapshot.phase).toBe('disconnected');
    });

    it('starts with the renderer-owned disconnected snapshot', () =>
    {
        const connection = new SocketConnection();

        expect(connection.connectionState).toEqual({
            phase: 'disconnected',
            reconnectAttempt: 0,
            maxReconnectAttempts: 7,
            authenticated: false,
            closeCode: null,
            closeReason: ''
        });
    });

    it('moves a reopened socket to reauthenticating with a reset attempt counter', () =>
    {
        const connection = new SocketConnection();
        const internals = connection as unknown as {
            _isReconnecting: boolean;
            _reconnectAttempt: number;
            setConnectionState(patch: Partial<IConnectionStateSnapshot>): void;
            onSocketOpened(): void;
        };

        internals._isReconnecting = true;
        internals._reconnectAttempt = 3;
        internals.setConnectionState({ phase: 'reconnecting', reconnectAttempt: 3 });
        internals.onSocketOpened();

        expect(connection.connectionState.phase).toBe('reauthenticating');
        expect(connection.connectionState.reconnectAttempt).toBe(0);
    });

    it('clears stale close metadata when intentionally disposed', () =>
    {
        const connection = new SocketConnection();
        const internals = connection as unknown as {
            setConnectionState(patch: Partial<IConnectionStateSnapshot>): void;
        };

        internals.setConnectionState({ phase: 'failed', closeCode: 1006, closeReason: 'server away' });
        connection.dispose();

        expect(connection.connectionState.phase).toBe('disconnected');
        expect(connection.connectionState.closeCode).toBeNull();
        expect(connection.connectionState.closeReason).toBe('');
    });
});
