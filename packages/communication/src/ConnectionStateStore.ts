import { IConnectionStateSnapshot } from '@octane/api';

export class ConnectionStateStore
{
    private _snapshot: Readonly<IConnectionStateSnapshot>;

    constructor(maxReconnectAttempts: number)
    {
        this._snapshot = Object.freeze({
            phase: 'disconnected',
            reconnectAttempt: 0,
            maxReconnectAttempts: Math.max(0, maxReconnectAttempts),
            authenticated: false,
            closeCode: null,
            closeReason: ''
        });
    }

    public get snapshot(): Readonly<IConnectionStateSnapshot>
    {
        return this._snapshot;
    }

    public update(patch: Partial<IConnectionStateSnapshot>): boolean
    {
        const next = {
            ...this._snapshot,
            ...patch,
            reconnectAttempt: Math.max(0, patch.reconnectAttempt ?? this._snapshot.reconnectAttempt),
            maxReconnectAttempts: Math.max(0, patch.maxReconnectAttempts ?? this._snapshot.maxReconnectAttempts)
        } satisfies IConnectionStateSnapshot;

        if((Object.keys(next) as (keyof IConnectionStateSnapshot)[]).every(key => next[key] === this._snapshot[key])) return false;

        this._snapshot = Object.freeze(next);

        return true;
    }
}
