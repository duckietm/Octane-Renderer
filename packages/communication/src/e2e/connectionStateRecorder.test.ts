import { IConnectionStateSnapshot } from '@nitrots/api';
import { describe, expect, it } from 'vitest';
import { recordConnectionStates } from './connectionStateRecorder';

describe('recordConnectionStates', () =>
{
    it('records the initial snapshot and each notified replacement in order', () =>
    {
        let snapshot: Readonly<IConnectionStateSnapshot> = Object.freeze({
            phase: 'disconnected',
            reconnectAttempt: 0,
            maxReconnectAttempts: 7,
            authenticated: false,
            closeCode: null,
            closeReason: ''
        });
        let listener: () => void = null;
        let unsubscribed = false;
        const recorder = recordConnectionStates(
            () => snapshot,
            callback =>
            {
                listener = callback;
                return () =>
                {
                    unsubscribed = true;
                };
            });

        snapshot = Object.freeze({ ...snapshot, phase: 'connecting' });
        listener();
        snapshot = Object.freeze({ ...snapshot, phase: 'authenticating' });
        listener();

        expect(recorder.states.map(state => state.phase)).toEqual([
            'disconnected',
            'connecting',
            'authenticating'
        ]);
        expect(Object.isFrozen(recorder.states[1])).toBe(true);

        recorder.dispose();
        expect(unsubscribed).toBe(true);
    });

    it('does not append the same immutable snapshot twice', () =>
    {
        const snapshot = Object.freeze({
            phase: 'connected',
            reconnectAttempt: 0,
            maxReconnectAttempts: 7,
            authenticated: true,
            closeCode: null,
            closeReason: ''
        } satisfies IConnectionStateSnapshot);
        let listener: () => void = null;
        const recorder = recordConnectionStates(
            () => snapshot,
            callback =>
            {
                listener = callback;
                return () =>
                {};
            });

        listener();

        expect(recorder.states).toHaveLength(1);
    });
});
