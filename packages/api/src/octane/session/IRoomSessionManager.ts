import { IRoomSession } from './IRoomSession';
import { IRoomSessionSnapshot } from './IRoomSessionSnapshot';

export interface IRoomSessionManager
{
    init(): Promise<void>;
    getSession(id: number): IRoomSession;
    createSession(roomId: number, password?: string): boolean;
    startSession(session: IRoomSession): boolean;
    removeSession(id: number, openLandingView?: boolean): void;
    tryRestoreSession(): boolean;
    getActiveRoomSessionSnapshot(): Readonly<IRoomSessionSnapshot> | null;
    viewerSession: IRoomSession;
}
