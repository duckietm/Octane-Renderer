import { GetConfiguration } from '@nitrots/configuration';
import { GetEventDispatcher, NitroEventType } from '@nitrots/events';
import { afterEach, describe, expect, it } from 'vitest';
import { CommunicationManager } from '../CommunicationManager';
import { GetCommunication } from '../GetCommunication';
import { RoomSessionManager } from '../../../session/src/RoomSessionManager';
import { recordConnectionStates } from './connectionStateRecorder';
import { readE2eEnvironment } from './e2eEnvironment';
import { waitFor } from './waitFor';
import { FurnitureAliasesComposer } from '../messages';

describe('Polaris login and reconnect', () =>
{
    let manager: CommunicationManager = null;

    afterEach(() =>
    {
        manager?.connection.dispose();
        manager?.dispose();
        GetEventDispatcher().removeAllListeners();
        GetConfiguration().resetConfiguration();
    });

    it('authenticates again after Polaris drops the active transport', async () =>
    {
        const environment = readE2eEnvironment(process.env);
        const configuration = GetConfiguration();
        configuration.resetConfiguration();
        configuration.setValue('socket.url', environment.wsUrl);
        configuration.setValue('sso.ticket', environment.ssoTicket);
        configuration.setValue('crypto.ws.enabled', false);
        configuration.setValue('system.pong.manually', false);

        manager = GetCommunication();
        (manager as unknown as { _machineIdPromise: Promise<string> })._machineIdPromise = Promise.resolve('IID-E2E-RECONNECT');
        const roomSessionManager = new RoomSessionManager();
        await roomSessionManager.init();

        const recorder = recordConnectionStates(
            () => manager.connection.connectionState,
            listener => GetEventDispatcher().subscribe(NitroEventType.CONNECTION_STATE_CHANGED, listener));

        try
        {
            let initError: unknown = null;
            let initialized = false;
            void manager.init()
                .then(() =>
                {
                    initialized = true;
                })
                .catch(error =>
                {
                    initError = error;
                });

            await waitFor(() => initialized || !!initError, {
                timeoutMs: 30000,
                description: 'initial Polaris authentication'
            });
            if(initError) throw initError;
            manager.connection.ready();

            const initialCount = await fetch(`${ environment.probeUrl }/session-count?userId=${ environment.userId }`);
            expect(await initialCount.json()).toEqual({ activeSessions: 1 });

            expect(roomSessionManager.createSession(environment.roomId)).toBe(true);
            manager.connection.send(new FurnitureAliasesComposer());
            const roomBeforeDrop = await waitForRoomState(
                environment.probeUrl,
                environment.userId,
                state => state.roomId === environment.roomId,
                'initial room entry');

            const drop = await fetch(`${ environment.probeUrl }/drop?userId=${ environment.userId }`, { method: 'POST' });
            expect(drop.status).toBe(204);

            try
            {
                await waitFor(() => recorder.states.filter(state => state.phase === 'connected').length >= 2, {
                    timeoutMs: 30000,
                    description: 'Polaris reauthentication after transport loss'
                });
            }
            catch (error)
            {
                throw new Error(`${ (error as Error).message }; states=${ JSON.stringify(recorder.states) }`);
            }

            expect(containsOrderedPhases(recorder.states.map(state => state.phase), [
                'connecting',
                'authenticating',
                'connected',
                'reconnecting',
                'reauthenticating',
                'connected'
            ])).toBe(true);
            expect(manager.connection.connectionState.authenticated).toBe(true);

            const recoveredCount = await fetch(`${ environment.probeUrl }/session-count?userId=${ environment.userId }`);
            expect(await recoveredCount.json()).toEqual({ activeSessions: 1 });

            const roomAfterReconnect = await waitForRoomState(
                environment.probeUrl,
                environment.userId,
                state => state.roomId === environment.roomId,
                'room state after reconnect');
            await assertRoomStateRemainsStable(environment.probeUrl, environment.userId, roomBeforeDrop, 1000);
            expect(roomAfterReconnect).toEqual(roomBeforeDrop);
        }
        finally
        {
            recorder.dispose();
        }
    });
});

const containsOrderedPhases = (actual: string[], expected: string[]): boolean =>
{
    let expectedIndex = 0;
    for(const phase of actual)
    {
        if(phase === expected[expectedIndex]) expectedIndex++;
        if(expectedIndex === expected.length) return true;
    }
    return false;
};

interface RoomState
{
    roomId: number;
    x: number;
    y: number;
    presenceIdentity: number;
    enteredAt: number;
}

const readRoomState = async (probeUrl: string, userId: number): Promise<RoomState> =>
{
    const response = await fetch(`${ probeUrl }/room-state?userId=${ userId }`);
    if(!response.ok) throw new Error(`Room-state probe failed with HTTP ${ response.status }`);
    return response.json() as Promise<RoomState>;
};

const waitForRoomState = async (
    probeUrl: string,
    userId: number,
    predicate: (state: RoomState) => boolean,
    description: string): Promise<RoomState> =>
{
    const deadline = Date.now() + 10000;
    let state = await readRoomState(probeUrl, userId);
    while(!predicate(state))
    {
        if(Date.now() >= deadline) throw new Error(`Timed out waiting for ${ description }; state=${ JSON.stringify(state) }`);
        await new Promise(resolve => setTimeout(resolve, 25));
        state = await readRoomState(probeUrl, userId);
    }
    return state;
};

const assertRoomStateRemainsStable = async (
    probeUrl: string,
    userId: number,
    expected: RoomState,
    durationMs: number): Promise<void> =>
{
    const deadline = Date.now() + durationMs;
    while(Date.now() < deadline)
    {
        expect(await readRoomState(probeUrl, userId)).toEqual(expected);
        await new Promise(resolve => setTimeout(resolve, 25));
    }
};
