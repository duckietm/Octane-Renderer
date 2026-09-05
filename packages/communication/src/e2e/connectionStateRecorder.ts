import { IConnectionStateSnapshot } from '@octane/api';

export interface ConnectionStateRecorder
{
    readonly states: Readonly<IConnectionStateSnapshot>[];
    dispose(): void;
}

export const recordConnectionStates = (
    readSnapshot: () => Readonly<IConnectionStateSnapshot>,
    subscribe: (listener: () => void) => () => void): ConnectionStateRecorder =>
{
    const states: Readonly<IConnectionStateSnapshot>[] = [];
    let lastSnapshot: Readonly<IConnectionStateSnapshot> = null;

    const record = () =>
    {
        const snapshot = readSnapshot();
        if(!snapshot || snapshot === lastSnapshot) return;

        lastSnapshot = snapshot;
        states.push(snapshot);
    };

    record();
    const unsubscribe = subscribe(record);

    return {
        states,
        dispose: () => unsubscribe()
    };
};
