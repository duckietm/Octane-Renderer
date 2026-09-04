import { IRoomHandlerListener, IRoomSession, IRoomSessionManager, IRoomSessionSnapshot } from '@nitrots/api';
import { GetCommunication, RoomEnterComposer, RoomUnitWalkComposer } from '@nitrots/communication';
import { GetEventDispatcher, NitroEvent, NitroEventType, RoomSessionEvent, SocketReauthenticatedEvent } from '@nitrots/events';
import { NitroLogger } from '@nitrots/utils';
import { RoomSession } from './RoomSession';
import { BaseHandler, GenericErrorHandler, PetPackageHandler, PollHandler, RoomChatHandler, RoomDataHandler, RoomDimmerPresetsHandler, RoomPermissionsHandler, RoomPresentHandler, RoomSessionHandler, RoomUsersHandler, WordQuizHandler } from './handler';
import { shouldAttemptRoomReEntry } from './reconnectRoomPolicy';

const STORAGE_KEY_ROOM_ID = 'nitro.session.lastRoomId';
const STORAGE_KEY_ROOM_PASSWORD = 'nitro.session.lastRoomPassword';
const STORAGE_KEY_POS_X = 'nitro.session.lastPosX';
const STORAGE_KEY_POS_Y = 'nitro.session.lastPosY';

export class RoomSessionManager implements IRoomSessionManager, IRoomHandlerListener
{
    private _handlers: BaseHandler[] = [];
    private _sessions: Map<string, IRoomSession> = new Map();
    private _pendingSession: IRoomSession = null;

    private _sessionStarting: boolean = false;
    private _viewerSession: IRoomSession = null;

    private _lastRoomId: number = -1;
    private _lastRoomPassword: string = null;
    private _isReconnecting: boolean = false;
    private _reconnectGuardTimer: ReturnType<typeof setTimeout> = null;
    private _pendingRoomClear: ReturnType<typeof setTimeout> = null;
    private _savedPosX: number = -1;
    private _savedPosY: number = -1;
    private _activeRoomSessionSnapshot: Readonly<IRoomSessionSnapshot> | null = null;

    public invalidateRoomSessionSnapshot(): void
    {
        this._activeRoomSessionSnapshot = null;

        GetEventDispatcher().dispatchEvent(new NitroEvent(NitroEventType.ROOM_SESSION_UPDATED));
    }

    public getActiveRoomSessionSnapshot(): Readonly<IRoomSessionSnapshot> | null
    {
        const session = this._viewerSession;

        if(!session) return null;

        if(this._activeRoomSessionSnapshot && this._activeRoomSessionSnapshot.session === session) return this._activeRoomSessionSnapshot;

        this._activeRoomSessionSnapshot = Object.freeze<IRoomSessionSnapshot>({
            roomId: session.roomId,
            state: session.state,
            isRoomOwner: session.isRoomOwner,
            isSpectator: session.isSpectator,
            isDecorating: session.isDecorating,
            isGuildRoom: session.isGuildRoom,
            isPrivateRoom: session.isPrivateRoom,
            controllerLevel: session.controllerLevel,
            doorMode: session.doorMode,
            tradeMode: session.tradeMode,
            allowPets: session.allowPets,
            groupId: session.groupId,
            session
        });

        return this._activeRoomSessionSnapshot;
    }

    public async init(): Promise<void>
    {
        this.createHandlers();
        this.processPendingSession();
        this.setupReconnectListener();
        this.checkPersistedRoom();
    }

    private checkPersistedRoom(): void
    {
        try
        {
            const storedRoomId = sessionStorage.getItem(STORAGE_KEY_ROOM_ID);

            if(!storedRoomId) return;

            const roomId = parseInt(storedRoomId, 10);

            if(isNaN(roomId) || roomId <= 0) return;

            this._lastRoomId = roomId;
            this._lastRoomPassword = sessionStorage.getItem(STORAGE_KEY_ROOM_PASSWORD) || null;

            this._isReconnecting = true;
        }
        catch (e)
        {}
    }

    private createHandlers(): void
    {
        const connection = GetCommunication().connection;

        if(!connection) return;

        this._handlers.push(
            new RoomChatHandler(connection, this),
            new RoomDataHandler(connection, this),
            new RoomDimmerPresetsHandler(connection, this),
            new RoomPermissionsHandler(connection, this),
            new RoomSessionHandler(connection, this),
            new RoomUsersHandler(connection, this),
            new RoomPresentHandler(connection, this),
            new GenericErrorHandler(connection, this),
            new WordQuizHandler(connection, this),
            new PollHandler(connection, this),
            new PetPackageHandler(connection, this),
        );
    }

    private setupReconnectListener(): void
    {
        GetEventDispatcher().addEventListener(NitroEventType.SOCKET_RECONNECTING, () =>
        {
            this.cancelRoomIdClear();
            if(this._lastRoomId > 0)
            {
                this.persistRoom(this._lastRoomId, this._lastRoomPassword);
            }
            this._isReconnecting = true;
        });

        GetEventDispatcher().addEventListener(NitroEventType.SOCKET_RECONNECTED, () =>
        {
            this.clearGuardTimer();

            if(shouldAttemptRoomReEntry(NitroEventType.SOCKET_RECONNECTED)) this.attemptRoomReEntry();
        });

        GetEventDispatcher().addEventListener<SocketReauthenticatedEvent>(NitroEventType.SOCKET_REAUTHENTICATED, event =>
        {
            this.snapshotSavedPosition();
            this.clearGuardTimer();

            if(shouldAttemptRoomReEntry(event.type, event, this._lastRoomId))
            {
                this.attemptRoomReEntry();
            }
            else
            {
                this._isReconnecting = false;
                this._savedPosX = -1;
                this._savedPosY = -1;
            }
        });

        GetEventDispatcher().addEventListener(NitroEventType.SOCKET_RECONNECT_FAILED, () =>
        {
            NitroLogger.log('[RoomSessionManager] SOCKET_RECONNECT_FAILED - clearing state');
            this.clearGuardTimer();
            this._isReconnecting = false;
            this._lastRoomId = -1;
            this._lastRoomPassword = null;
            this.clearPersistedRoom();
            this.clearPersistedPosition();
        });

        GetEventDispatcher().addEventListener(NitroEventType.SOCKET_CLOSED, () =>
        {
            this.clearGuardTimer();
            this._isReconnecting = false;
            this._lastRoomId = -1;
            this._lastRoomPassword = null;
            this.clearPersistedRoom();
            this.clearPersistedPosition();
        });
    }

    private clearGuardTimer(): void
    {
        if(this._reconnectGuardTimer)
        {
            clearTimeout(this._reconnectGuardTimer);
            this._reconnectGuardTimer = null;
        }
    }

    private scheduleRoomIdClear(): void
    {
        if(this._pendingRoomClear)
        {
            clearTimeout(this._pendingRoomClear);
        }

        this._pendingRoomClear = setTimeout(() =>
        {
            this._pendingRoomClear = null;
            this._lastRoomId = -1;
            this._lastRoomPassword = null;
        }, 5000);
    }

    private cancelRoomIdClear(): void
    {
        if(this._pendingRoomClear)
        {
            clearTimeout(this._pendingRoomClear);
            this._pendingRoomClear = null;
        }
    }

    private attemptRoomReEntry(): void
    {
        const roomId = this._lastRoomId;
        const password = this._lastRoomPassword;

        if(roomId <= 0)
        {
            this._isReconnecting = false;

            return;
        }

        const existingSession = this.getSession(roomId);

        if(existingSession)
        {
            GetCommunication().connection.send(new RoomEnterComposer(roomId, password, this._savedPosX, this._savedPosY));

            this.clearGuardTimer();
            this._reconnectGuardTimer = setTimeout(() =>
            {
                this._reconnectGuardTimer = null;

                if(this._isReconnecting)
                {
                    this._isReconnecting = false;
                }
            }, 5000);

            return;
        }

        this._sessions.clear();
        this._viewerSession = null;
        this.invalidateRoomSessionSnapshot();
        this.createSession(roomId, password, this._savedPosX, this._savedPosY);
        this.clearGuardTimer();
        this._reconnectGuardTimer = setTimeout(() =>
        {
            this._reconnectGuardTimer = null;

            if(this._isReconnecting)
            {
                this._isReconnecting = false;
            }
        }, 10000);
    }

    public tryRestoreSession(): boolean
    {
        try
        {
            const storedRoomId = sessionStorage.getItem(STORAGE_KEY_ROOM_ID);

            if(!storedRoomId) return false;

            const roomId = parseInt(storedRoomId, 10);

            if(isNaN(roomId) || roomId <= 0) return false;

            const password = sessionStorage.getItem(STORAGE_KEY_ROOM_PASSWORD) || null;

            let spawnX = -1;
            let spawnY = -1;

            try
            {
                const posX = sessionStorage.getItem(STORAGE_KEY_POS_X);
                const posY = sessionStorage.getItem(STORAGE_KEY_POS_Y);

                if(posX && posY)
                {
                    spawnX = parseInt(posX, 10);
                    spawnY = parseInt(posY, 10);

                    if(isNaN(spawnX) || isNaN(spawnY))
                    {
                        spawnX = -1; spawnY = -1;
                    }
                }
            }
            catch (e)
            {}

            this._isReconnecting = true;
            this.createSession(roomId, password, spawnX, spawnY);
            this.clearGuardTimer();
            this._reconnectGuardTimer = setTimeout(() =>
            {
                this._reconnectGuardTimer = null;

                if(this._isReconnecting)
                {
                    this._isReconnecting = false;
                }
            }, 10000);

            return true;
        }
        catch (e)
        {
            return false;
        }
    }

    private persistRoom(roomId: number, password: string): void
    {
        try
        {
            if(roomId > 0)
            {
                sessionStorage.setItem(STORAGE_KEY_ROOM_ID, roomId.toString());

                if(password)
                {
                    sessionStorage.setItem(STORAGE_KEY_ROOM_PASSWORD, password);
                }
                else
                {
                    sessionStorage.removeItem(STORAGE_KEY_ROOM_PASSWORD);
                }
            }
            else
            {
                this.clearPersistedRoom();
            }
        }
        catch (e)
        {}
    }

    private clearPersistedRoom(): void
    {
        try
        {
            sessionStorage.removeItem(STORAGE_KEY_ROOM_ID);
            sessionStorage.removeItem(STORAGE_KEY_ROOM_PASSWORD);
        }
        catch (e)
        {}
    }

    private clearPersistedPosition(): void
    {
        try
        {
            sessionStorage.removeItem(STORAGE_KEY_POS_X);
            sessionStorage.removeItem(STORAGE_KEY_POS_Y);
        }
        catch (e)
        {}
    }

    private snapshotSavedPosition(): void
    {
        try
        {
            const posX = sessionStorage.getItem(STORAGE_KEY_POS_X);
            const posY = sessionStorage.getItem(STORAGE_KEY_POS_Y);

            if(!posX || !posY) return;

            this._savedPosX = parseInt(posX, 10);
            this._savedPosY = parseInt(posY, 10);

        }
        catch (e)
        {
            this._savedPosX = -1;
            this._savedPosY = -1;
        }
    }

    private setHandlers(session: IRoomSession): void
    {
        if(!this._handlers || !this._handlers.length) return;

        for(const handler of this._handlers)
        {
            if(!handler) continue;

            handler.setRoomId(session.roomId);
        }
    }

    private processPendingSession(): void
    {
        if(!this._pendingSession) return;

        this.addSession(this._pendingSession);

        this._pendingSession = null;
    }

    public getSession(id: number): IRoomSession
    {
        const existing = this._sessions.get(this.getRoomId(id));

        if(!existing) return null;

        return existing;
    }

    public createSession(roomId: number, password: string = null, spawnX: number = -1, spawnY: number = -1): boolean
    {
        const session = new RoomSession();

        session.roomId = roomId;
        session.password = password;
        session.spawnX = spawnX;
        session.spawnY = spawnY;

        return this.addSession(session);
    }

    private addSession(roomSession: IRoomSession): boolean
    {
        this._sessionStarting = true;

        if(this._sessions.get(this.getRoomId(roomSession.roomId))) this.removeSession(roomSession.roomId, false);

        this._sessions.set(this.getRoomId(roomSession.roomId), roomSession);

        GetEventDispatcher().dispatchEvent(new RoomSessionEvent(RoomSessionEvent.CREATED, roomSession));

        this._viewerSession = roomSession;
        this._lastRoomId = roomSession.roomId;
        this._lastRoomPassword = roomSession.password;
        this.persistRoom(roomSession.roomId, roomSession.password);

        this.invalidateRoomSessionSnapshot();

        this.startSession(this._viewerSession);

        return true;
    }

    public startSession(session: IRoomSession): boolean
    {
        if(session.state === RoomSessionEvent.STARTED) return false;

        this._sessionStarting = false;

        if(!session.start())
        {
            this.removeSession(session.roomId);

            return false;
        }

        GetEventDispatcher().dispatchEvent(new RoomSessionEvent(RoomSessionEvent.STARTED, session));

        this.setHandlers(session);

        this.invalidateRoomSessionSnapshot();

        return true;
    }

    public removeSession(id: number, openLandingView: boolean = true): void
    {
        const session = this.getSession(id);

        if(!session) return;

        if(this._isReconnecting)
        {
            return;
        }

        this._sessions.delete(this.getRoomId(id));

        if(openLandingView)
        {
            this.clearPersistedRoom();
            this.scheduleRoomIdClear();
        }

        GetEventDispatcher().dispatchEvent(new RoomSessionEvent(RoomSessionEvent.ENDED, session, openLandingView));

        if(this._viewerSession === session) this._viewerSession = null;

        this.invalidateRoomSessionSnapshot();
    }

    public sessionUpdate(id: number, type: string): void
    {
        const session = this.getSession(id);

        if(!session)
        {
            return;
        }

        switch(type)
        {
            case RoomSessionHandler.RS_CONNECTED:
                return;
            case RoomSessionHandler.RS_READY:

                if(this._isReconnecting)
                {
                    if(this._savedPosX >= 0 && this._savedPosY >= 0)
                    {
                        GetCommunication().connection.send(new RoomUnitWalkComposer(this._savedPosX, this._savedPosY));
                        this._savedPosX = -1;
                        this._savedPosY = -1;
                    }

                    this.clearGuardTimer();
                    this._reconnectGuardTimer = setTimeout(() =>
                    {
                        this._reconnectGuardTimer = null;

                        if(this._isReconnecting)
                        {
                            this._isReconnecting = false;
                        }
                    }, 3000);
                }

                return;
            case RoomSessionHandler.RS_DISCONNECTED:

                if(this._isReconnecting) return;

                this.removeSession(id);
                return;
        }
    }

    public sessionReinitialize(fromRoomId: number, toRoomId: number): void
    {
        const existing = this.getSession(fromRoomId);

        if(!existing) return;

        this._sessions.delete(this.getRoomId(fromRoomId));

        existing.reset(toRoomId);

        this._sessions.set(this.getRoomId(toRoomId), existing);

        this._lastRoomId = toRoomId;
        this.persistRoom(toRoomId, existing.password);

        this.setHandlers(existing);
    }

    private getRoomId(id: number): string
    {
        return 'hard_coded_room_id';
    }

    public get viewerSession(): IRoomSession
    {
        return this._viewerSession;
    }

    public get isReconnecting(): boolean
    {
        return this._isReconnecting;
    }
}
