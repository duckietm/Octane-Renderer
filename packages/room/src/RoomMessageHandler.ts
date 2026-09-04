import { AvatarGuideStatus, IConnection, IMessageEvent, IRoomCreator, IRoomObjectController, IRoomObject, IVector3D, LegacyDataType, ObjectRolling, PetType, RoomObjectCategory, RoomObjectType, RoomObjectUserType, RoomObjectVariable } from '@nitrots/api';
import { AreaHideMessageEvent, ConfInvisStateMessageEvent, DiceValueMessageEvent, FloorHeightMapEvent, FurnitureAliasesComposer, FurnitureAliasesEvent, FurnitureDataEvent, FurnitureFloorAddEvent, FurnitureFloorDataParser, FurnitureFloorEvent, FurnitureFloorRemoveEvent, FurnitureFloorUpdateEvent, FurnitureWallAddEvent, FurnitureWallDataParser, FurnitureWallEvent, FurnitureWallRemoveEvent, FurnitureWallUpdateEvent, GetCommunication, GetRoomEntryDataMessageComposer, GuideSessionEndedMessageEvent, GuideSessionErrorMessageEvent, GuideSessionStartedMessageEvent, IgnoreResultEvent, ItemDataUpdateMessageEvent, ObjectsDataUpdateEvent, ObjectsRollingEvent, OneWayDoorStatusMessageEvent, PetExperienceEvent, PetFigureUpdateEvent, RoomEntryTileMessageEvent, RoomEntryTileMessageParser, RoomHeightMapEvent, RoomHeightMapUpdateEvent, RoomPaintEvent, RoomReadyMessageEvent, RoomUnitChatEvent, RoomUnitChatShoutEvent, RoomUnitChatWhisperEvent, RoomUnitDanceEvent, RoomUnitEffectEvent, RoomUnitEvent, RoomUnitExpressionEvent, RoomUnitHabbiconEvent, RoomUnitHandItemEvent, RoomUnitIdleEvent, RoomUnitInfoEvent, RoomUnitNumberEvent, RoomUnitRemoveEvent, RoomUnitStatusEvent, RoomUnitStatusMessage, RoomUnitTypingEvent, RoomVisualizationSettingsEvent, UserInfoEvent, WiredFurniMoveStyleEvent, WiredFurniMovementData, WiredMovementsEvent, WiredUserDirectionUpdateData, WiredUserMovementData, YouArePlayingGameEvent } from '@nitrots/communication';
import { GetRoomSessionManager, GetSessionDataManager } from '@nitrots/session';
import { Vector3d } from '@nitrots/utils';
import { FloorHeightMapMessageParser } from '@nitrots/communication';
import { GetRoomEngine } from './GetRoomEngine';
import { RoomVariableEnum } from './RoomVariableEnum';
import { ObjectRoomMapUpdateMessage } from './messages';
import { RoomPlaneParser } from './object/RoomPlaneParser';
import { FurnitureStackingHeightMap, LegacyWallGeometry } from './utils';

const ROOM_OWN_OBJECT_ID = -1;

type AreaHideControllerState = {
    rootX: number;
    rootY: number;
    width: number;
    length: number;
    invert: boolean;
    wallItems: boolean;
    invisibility: boolean;
};

export class RoomMessageHandler
{
    private static WIRED_FURNI_ANCHOR_NONE = 0;
    private static WIRED_FURNI_ANCHOR_USER = 1;
    private static WIRED_FURNI_ANCHOR_FURNI = 2;
    private static ROOM_USER_WALK_DURATION = 500;
    private static WIRED_MOVEMENT_STATUS_GRACE = 250;
    private static WIRED_MOVEMENT_Z_EPSILON = 0.01;

    private _connection: IConnection = null;
    private _roomEngine: IRoomCreator = null;
    private _planeParser = new RoomPlaneParser();
    private _latestEntryTileEvent: RoomEntryTileMessageEvent = null;
    private _messageEvents: IMessageEvent[] = [];
    private _activeWiredUserMovements = new Map<number, { expiresAt: number, sourceX: number, sourceY: number, sourceZ: number, targetX: number, targetY: number, targetZ: number }>();
    private _activeRoomUserWalks = new Map<number, { startedAt: number, targetX: number, targetY: number, targetZ: number, duration: number }>();
    private _jumpingUnitIds = new Set<number>();
    private _roomUnitIndexByIdentity = new Map<string, number>();
    private _activeConfInvisHiddenItemIds = new Set<number>();
    private _confInvisReapplyTimeouts: ReturnType<typeof setTimeout>[] = [];
    private _activeAreaHideControllers = new Map<number, AreaHideControllerState>();
    private _areaHideReapplyTimeouts: ReturnType<typeof setTimeout>[] = [];
    private _isConfInvisControlActive = false;

    private _currentRoomId: number = 0;
    private _ownUserId: number = 0;
    private _ownRoomIndex: number = -1;
    private _initialConnection: boolean = true;
    private _guideId: number = -1;
    private _requesterId: number = -1;

    public async init(): Promise<void>
    {
        this._connection = GetCommunication().connection;
        this._roomEngine = GetRoomEngine();
        this._messageEvents = [
            new UserInfoEvent(this.onUserInfoEvent.bind(this)),
            new RoomReadyMessageEvent(this.onRoomReadyMessageEvent.bind(this)),
            new RoomPaintEvent(this.onRoomPaintEvent.bind(this)),
            new FloorHeightMapEvent(this.onRoomModelEvent.bind(this)),
            new RoomHeightMapEvent(this.onRoomHeightMapEvent.bind(this)),
            new RoomHeightMapUpdateEvent(this.onRoomHeightMapUpdateEvent.bind(this)),
            new RoomVisualizationSettingsEvent(this.onRoomThicknessEvent.bind(this)),
            new RoomEntryTileMessageEvent(this.onRoomDoorEvent.bind(this)),
            new ObjectsRollingEvent(this.onRoomRollingEvent.bind(this)),
            new WiredMovementsEvent(this.onWiredMovementsEvent.bind(this)),
            new WiredFurniMoveStyleEvent(this.onWiredFurniMoveStyleEvent.bind(this)),
            new ObjectsDataUpdateEvent(this.onObjectsDataUpdateEvent.bind(this)),
            new FurnitureAliasesEvent(this.onFurnitureAliasesEvent.bind(this)),
            new FurnitureFloorAddEvent(this.onFurnitureFloorAddEvent.bind(this)),
            new FurnitureFloorEvent(this.onFurnitureFloorEvent.bind(this)),
            new FurnitureFloorRemoveEvent(this.onFurnitureFloorRemoveEvent.bind(this)),
            new FurnitureFloorUpdateEvent(this.onFurnitureFloorUpdateEvent.bind(this)),
            new FurnitureWallAddEvent(this.onFurnitureWallAddEvent.bind(this)),
            new FurnitureWallEvent(this.onFurnitureWallEvent.bind(this)),
            new FurnitureWallRemoveEvent(this.onFurnitureWallRemoveEvent.bind(this)),
            new FurnitureWallUpdateEvent(this.onFurnitureWallUpdateEvent.bind(this)),
            new FurnitureDataEvent(this.onFurnitureDataEvent.bind(this)),
            new ItemDataUpdateMessageEvent(this.onItemDataUpdateMessageEvent.bind(this)),
            new OneWayDoorStatusMessageEvent(this.onOneWayDoorStatusMessageEvent.bind(this)),
            new AreaHideMessageEvent(this.onAreaHideMessageEvent.bind(this)),
            new ConfInvisStateMessageEvent(this.onConfInvisStateMessageEvent.bind(this)),
            new RoomUnitDanceEvent(this.onRoomUnitDanceEvent.bind(this)),
            new RoomUnitEffectEvent(this.onRoomUnitEffectEvent.bind(this)),
            new RoomUnitEvent(this.onRoomUnitEvent.bind(this)),
            new RoomUnitExpressionEvent(this.onRoomUnitExpressionEvent.bind(this)),
            new RoomUnitHabbiconEvent(this.onRoomUnitHabbiconEvent.bind(this)),
            new RoomUnitHandItemEvent(this.onRoomUnitHandItemEvent.bind(this)),
            new RoomUnitIdleEvent(this.onRoomUnitIdleEvent.bind(this)),
            new RoomUnitInfoEvent(this.onRoomUnitInfoEvent.bind(this)),
            new RoomUnitNumberEvent(this.onRoomUnitNumberEvent.bind(this)),
            new RoomUnitRemoveEvent(this.onRoomUnitRemoveEvent.bind(this)),
            new RoomUnitStatusEvent(this.onRoomUnitStatusEvent.bind(this)),
            new RoomUnitChatEvent(this.onRoomUnitChatEvent.bind(this)),
            new RoomUnitChatShoutEvent(this.onRoomUnitChatEvent.bind(this)),
            new RoomUnitChatWhisperEvent(this.onRoomUnitChatEvent.bind(this)),
            new RoomUnitTypingEvent(this.onRoomUnitTypingEvent.bind(this)),
            new PetFigureUpdateEvent(this.onPetFigureUpdateEvent.bind(this)),
            new PetExperienceEvent(this.onPetExperienceEvent.bind(this)),
            new YouArePlayingGameEvent(this.onYouArePlayingGameEvent.bind(this)),
            new DiceValueMessageEvent(this.onDiceValueMessageEvent.bind(this)),
            new IgnoreResultEvent(this.onIgnoreResultEvent.bind(this)),
            new GuideSessionStartedMessageEvent(this.onGuideSessionStartedMessageEvent.bind(this)),
            new GuideSessionEndedMessageEvent(this.onGuideSessionEndedMessageEvent.bind(this)),
            new GuideSessionErrorMessageEvent(this.onGuideSessionErrorMessageEvent.bind(this))
        ];

        for(const event of this._messageEvents)
        {
            this._connection.addMessageEvent(event);
        }
    }

    public dispose(): void
    {
        if(this._connection)
        {
            for(const event of this._messageEvents)
            {
                this._connection.removeMessageEvent(event);
            }
        }

        this._messageEvents = [];
        this._connection = null;
        this._roomEngine = null;
        this._latestEntryTileEvent = null;
        this._activeWiredUserMovements.clear();
        this._activeRoomUserWalks.clear();
        this._jumpingUnitIds.clear();
        this._roomUnitIndexByIdentity.clear();
        if(this._planeParser)
        {
            this._planeParser.dispose();
            this._planeParser = null;
        }
        this._activeConfInvisHiddenItemIds.clear();
        this.clearConfInvisReapplyTimeouts();
        this._activeAreaHideControllers.clear();
        this.clearAreaHideReapplyTimeouts();
        this._isConfInvisControlActive = false;
    }

    public setRoomId(id: number): void
    {
        if(this._currentRoomId !== 0)
        {
            if(this._roomEngine) this._roomEngine.destroyRoom(this._currentRoomId);
        }

        this._currentRoomId = id;
        this._latestEntryTileEvent = null;
        this._activeWiredUserMovements.clear();
        this._activeRoomUserWalks.clear();
        this._jumpingUnitIds.clear();
        this._roomUnitIndexByIdentity.clear();
        this._activeConfInvisHiddenItemIds.clear();
        this.clearConfInvisReapplyTimeouts();
        this._activeAreaHideControllers.clear();
        this.clearAreaHideReapplyTimeouts();
        this._isConfInvisControlActive = false;
    }

    public clearRoomId(): void
    {
        this._currentRoomId = 0;
        this._latestEntryTileEvent = null;
        this._activeWiredUserMovements.clear();
        this._activeRoomUserWalks.clear();
        this._jumpingUnitIds.clear();
        this._roomUnitIndexByIdentity.clear();
        this._activeConfInvisHiddenItemIds.clear();
        this.clearConfInvisReapplyTimeouts();
        this._activeAreaHideControllers.clear();
        this.clearAreaHideReapplyTimeouts();
        this._isConfInvisControlActive = false;
    }

    private onUserInfoEvent(event: UserInfoEvent): void
    {
        if(!(event instanceof UserInfoEvent) || !event.connection) return;

        const parser = event.getParser();

        if(!parser) return;

        this._ownUserId = parser.userInfo.userId;
    }

    private onRoomReadyMessageEvent(event: RoomReadyMessageEvent): void
    {
        const parser = event.getParser();

        if(this._currentRoomId !== parser.roomId)
        {
            this.setRoomId(parser.roomId);
        }

        if(this._roomEngine)
        {
            this._roomEngine.setRoomInstanceModelName(parser.roomId, parser.name);
        }

        if(this._initialConnection)
        {
            event.connection.send(new FurnitureAliasesComposer());

            this._initialConnection = false;

            return;
        }

        event.connection.send(new GetRoomEntryDataMessageComposer());
    }

    private onRoomPaintEvent(event: RoomPaintEvent): void
    {
        if(!(event instanceof RoomPaintEvent)) return;

        const parser = event.getParser();

        if(!parser) return;

        const floorType = parser.floorType;
        const wallType = parser.wallType;
        const landscapeType = parser.landscapeType;

        if(this._roomEngine)
        {
            this._roomEngine.updateRoomInstancePlaneType(this._currentRoomId, floorType, wallType, landscapeType);
        }
    }

    private onRoomModelEvent(event: FloorHeightMapEvent): void
    {
        if(!(event instanceof FloorHeightMapEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        const roomMap = this._rebuildFloorGeometry(parser);

        if(!roomMap) return;

        this._roomEngine.createRoomInstance(this._currentRoomId, roomMap);
    }

    public applyFloorModelLocally(modelString: string, wallHeight: number, scale: boolean = true): boolean
    {
        if(!this._roomEngine || this._currentRoomId <= 0 || !modelString) return false;

        const parser = new FloorHeightMapMessageParser();

        parser.flush();

        if(!parser.parseModel(modelString, wallHeight, scale)) return false;

        const roomMap = this._rebuildFloorGeometry(parser);

        if(!roomMap) return false;

        const roomObject = this._roomEngine.getRoomObject(this._currentRoomId, ROOM_OWN_OBJECT_ID, RoomObjectCategory.ROOM);

        if(!roomObject) return false;

        const currentMap = roomObject.model.getValue<{ holeMap?: { id: number, x: number, y: number, width: number, height: number, invert: boolean }[] }>(RoomObjectVariable.ROOM_MAP_DATA);

        if(currentMap && currentMap.holeMap && currentMap.holeMap.length)
        {
            for(const hole of currentMap.holeMap)
            {
                if(hole) roomMap.holeMap.push(hole);
            }
        }

        roomObject.processUpdateMessage(new ObjectRoomMapUpdateMessage(roomMap));
        this._rebuildFurnitureStackingMap(parser);
        return true;
    }

    private _rebuildFurnitureStackingMap(parser: FloorHeightMapMessageParser): void
    {
        if(!this._roomEngine) return;

        const width = parser.width;
        const height = parser.height;
        const heightMap = new FurnitureStackingHeightMap(width, height);
        const BLOCKED = FloorHeightMapMessageParser.TILE_BLOCKED;

        let y = 0;

        while(y < height)
        {
            let x = 0;

            while(x < width)
            {
                const tileHeight = parser.getHeight(x, y);
                const isRoomTile = (tileHeight !== BLOCKED);

                heightMap.setTileHeight(x, y, isRoomTile ? tileHeight : 0);
                heightMap.setStackingBlocked(x, y, false);
                heightMap.setIsRoomTile(x, y, isRoomTile);

                x++;
            }

            y++;
        }

        this._roomEngine.setFurnitureStackingHeightMap(this._currentRoomId, heightMap);
        this._roomEngine.refreshTileObjectMap(this._currentRoomId, 'RoomMessageHandler.applyFloorModelLocally');
    }

    private _rebuildFloorGeometry(parser: FloorHeightMapMessageParser)
    {
        const wallGeometry = this._roomEngine.getLegacyWallGeometry(this._currentRoomId);

        if(!wallGeometry) return null;

        this._planeParser.reset();

        const width = parser.width;
        const height = parser.height;

        this._planeParser.initializeTileMap(width, height);

        let entryTile: RoomEntryTileMessageParser = null;

        if(this._latestEntryTileEvent) entryTile = this._latestEntryTileEvent.getParser();

        let doorX = -1;
        let doorY = -1;
        let doorZ = 0;
        let doorDirection = 0;

        let y = 0;

        while(y < height)
        {
            let x = 0;

            while(x < width)
            {
                const tileHeight = parser.getHeight(x, y);

                if(((((y > 0) && (y < (height - 1))) || ((x > 0) && (x < (width - 1)))) && (!(tileHeight == RoomPlaneParser.TILE_BLOCKED))) && ((entryTile == null) || ((x == entryTile.x) && (y == entryTile.y))))
                {
                    if(((parser.getHeight(x, (y - 1)) == RoomPlaneParser.TILE_BLOCKED) && (parser.getHeight((x - 1), y) == RoomPlaneParser.TILE_BLOCKED)) && (parser.getHeight(x, (y + 1)) == RoomPlaneParser.TILE_BLOCKED))
                    {
                        doorX = (x + 0.5);
                        doorY = y;
                        doorZ = tileHeight;
                        doorDirection = 90;
                    }

                    if(((parser.getHeight(x, (y - 1)) == RoomPlaneParser.TILE_BLOCKED) && (parser.getHeight((x - 1), y) == RoomPlaneParser.TILE_BLOCKED)) && (parser.getHeight((x + 1), y) == RoomPlaneParser.TILE_BLOCKED))
                    {
                        doorX = x;
                        doorY = (y + 0.5);
                        doorZ = tileHeight;
                        doorDirection = 180;
                    }
                }

                this._planeParser.setTileHeight(x, y, tileHeight);

                x++;
            }

            y++;
        }

        this._planeParser.setTileHeight(Math.floor(doorX), Math.floor(doorY), doorZ);
        this._planeParser.initializeFromTileData(parser.wallHeight);
        this._planeParser.setTileHeight(Math.floor(doorX), Math.floor(doorY), (doorZ + this._planeParser.wallHeight));

        wallGeometry.scale = LegacyWallGeometry.DEFAULT_SCALE;
        wallGeometry.initialize(width, height, this._planeParser.floorHeight);

        let heightIterator = (parser.height - 1);

        while(heightIterator >= 0)
        {
            let widthIterator = (parser.width - 1);

            while(widthIterator >= 0)
            {
                wallGeometry.setHeight(widthIterator, heightIterator, this._planeParser.getTileHeight(widthIterator, heightIterator));
                widthIterator--;
            }

            heightIterator--;
        }

        const roomMap = this._planeParser.getMapData();

        roomMap.doors.push({
            x: doorX,
            y: doorY,
            z: doorZ,
            dir: doorDirection
        });

        return roomMap;
    }

    private onRoomHeightMapEvent(event: RoomHeightMapEvent): void
    {
        if(!(event instanceof RoomHeightMapEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        const width = parser.width;
        const height = parser.height;
        const heightMap = new FurnitureStackingHeightMap(width, height);

        let y = 0;

        while(y < height)
        {
            let x = 0;

            while(x < width)
            {
                heightMap.setTileHeight(x, y, parser.getTileHeight(x, y));
                heightMap.setStackingBlocked(x, y, parser.getStackingBlocked(x, y));
                heightMap.setIsRoomTile(x, y, parser.isRoomTile(x, y));

                x++;
            }

            y++;
        }

        this._roomEngine.setFurnitureStackingHeightMap(this._currentRoomId, heightMap);
    }

    private onRoomHeightMapUpdateEvent(event: RoomHeightMapUpdateEvent): void
    {
        if(!(event instanceof RoomHeightMapUpdateEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        const heightMap = this._roomEngine.getFurnitureStackingHeightMap(this._currentRoomId);

        if(!heightMap) return;

        while(parser.next())
        {
            heightMap.setTileHeight(parser.x, parser.y, parser.tileHeight());
            heightMap.setStackingBlocked(parser.x, parser.y, parser.isStackingBlocked());
            heightMap.setIsRoomTile(parser.x, parser.y, parser.isRoomTile());
        }

        this._roomEngine.refreshTileObjectMap(this._currentRoomId, 'RoomMessageHandler.onRoomHeightMapUpdateEvent()');
    }

    private onRoomThicknessEvent(event: RoomVisualizationSettingsEvent): void
    {
        if(!(event instanceof RoomVisualizationSettingsEvent)) return;

        const parser = event.getParser();

        if(!parser) return;

        const visibleWall = !parser.hideWalls;
        const visibleFloor = true;
        const thicknessWall = parser.thicknessWall;
        const thicknessFloor = parser.thicknessFloor;

        if(this._roomEngine)
        {
            this._roomEngine.updateRoomInstancePlaneVisibility(this._currentRoomId, visibleWall, visibleFloor);
            this._roomEngine.updateRoomInstancePlaneThickness(this._currentRoomId, thicknessWall, thicknessFloor);
        }
    }

    private onRoomDoorEvent(event: RoomEntryTileMessageEvent): void
    {
        if(!(event instanceof RoomEntryTileMessageEvent)) return;

        this._latestEntryTileEvent = event;
    }

    private onRoomRollingEvent(event: ObjectsRollingEvent): void
    {
        if(!(event instanceof ObjectsRollingEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        this._roomEngine.updateRoomObjectFloor(this._currentRoomId, parser.rollerId, null, null, 1, null);
        this._roomEngine.updateRoomObjectFloor(this._currentRoomId, parser.rollerId, null, null, 2, null);
        this.applyConfInvisStateToFloorObjects([ parser.rollerId ]);
        this.applyAreaHideStateToFloorObjects([ parser.rollerId ]);

        const furnitureRolling = parser.itemsRolling;

        if(furnitureRolling && furnitureRolling.length)
        {
            for(const rollData of furnitureRolling)
            {
                if(!rollData) continue;

                this._roomEngine.rollRoomObjectFloor(this._currentRoomId, rollData.id, rollData.location, rollData.targetLocation);
            }

            this.scheduleAreaHideReapply(this._currentRoomId);
        }

        const unitRollData = parser.unitRolling;

        if(unitRollData)
        {
            this.applyRollingUnitMovement(unitRollData);
        }
    }

    private onWiredFurniMoveStyleEvent(event: WiredFurniMoveStyleEvent): void
    {
        if(!(event instanceof WiredFurniMoveStyleEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser || !parser.itemIds.length) return;

        for(const itemId of parser.itemIds)
        {
            const object = this._roomEngine.getRoomObject(this._currentRoomId, itemId, RoomObjectCategory.FLOOR);

            if(!object || !object.model) continue;

            object.model.setValue(RoomObjectVariable.FURNITURE_MOVE_STYLE, parser.style);
            object.model.setValue(RoomObjectVariable.FURNITURE_MOVE_STYLE_INTENSITY, parser.intensity);
        }
    }

    private onWiredMovementsEvent(event: WiredMovementsEvent): void
    {
        if(!(event instanceof WiredMovementsEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        if(parser.furniMovements?.length)
        {
            for(const movement of parser.furniMovements)
            {
                if(!movement) continue;

                const resolvedMovement = this.resolveAnchoredFurniMovement(movement);

                this._roomEngine.rollRoomObjectFloor(
                    this._currentRoomId,
                    movement.id,
                    resolvedMovement.location,
                    resolvedMovement.targetLocation,
                    resolvedMovement.duration,
                    new Vector3d(movement.rotation),
                    resolvedMovement.elapsed,
                    resolvedMovement.anchorObject,
                    resolvedMovement.anchorOffset);
            }
        }

        if(parser.userMovements?.length)
        {
            for(const movement of parser.userMovements)
            {
                if(!movement) continue;

                this.applyWiredUserMovement(movement);
            }
        }

        if(parser.userDirectionUpdates?.length)
        {
            for(const update of parser.userDirectionUpdates)
            {
                if(!update) continue;

                this.applyWiredUserDirectionUpdate(update);
            }
        }
    }

    private applyRollingUnitMovement(movement: ObjectRolling): void
    {
        // isSlide must be set so MovingObjectLogic treats consecutive roller
        // pulses as a chain (queueing + cadence smoothing) instead of
        // restarting a fresh move on every pulse.
        this._roomEngine.updateRoomObjectUserLocation(this._currentRoomId, movement.id, movement.location, movement.targetLocation, false, 0, null, NaN, true, true);

        const object = this._roomEngine.getRoomObjectUser(this._currentRoomId, movement.id);

        if(object && object.type !== RoomObjectUserType.MONSTER_PLANT)
        {
            const posture = (movement.movementType === ObjectRolling.MOVE) ? 'mv' : 'std';

            this._roomEngine.updateRoomObjectUserPosture(this._currentRoomId, movement.id, posture);
        }
    }

    private resolveAnchoredFurniMovement(movement: WiredFurniMovementData): { location: IVector3D, targetLocation: IVector3D, duration: number, elapsed: number, anchorObject: IRoomObjectController, anchorOffset: IVector3D }
    {
        if(!movement || !movement.anchorType || (movement.anchorType === RoomMessageHandler.WIRED_FURNI_ANCHOR_NONE))
        {
            return {
                location: movement.location,
                targetLocation: movement.targetLocation,
                duration: movement.duration,
                elapsed: movement.elapsed,
                anchorObject: null,
                anchorOffset: null
            };
        }

        const anchorObject = this.getWiredFurniAnchorObject(movement);
        const activeUserWalk = (movement.anchorType === RoomMessageHandler.WIRED_FURNI_ANCHOR_USER)
            ? this.getActiveRoomUserWalk(movement.anchorId)
            : null;

        if(activeUserWalk)
        {
            const walkElapsed = Math.max(0, Math.min(activeUserWalk.duration, (Date.now() - activeUserWalk.startedAt)));

            return {
                location: movement.location,
                targetLocation: new Vector3d(activeUserWalk.targetX, activeUserWalk.targetY, activeUserWalk.targetZ),
                duration: activeUserWalk.duration,
                elapsed: walkElapsed,
                anchorObject: null,
                anchorOffset: null
            };
        }

        if(!anchorObject)
        {
            return {
                location: movement.location,
                targetLocation: movement.targetLocation,
                duration: movement.duration,
                elapsed: movement.elapsed,
                anchorObject: null,
                anchorOffset: null
            };
        }

        const anchorLocation = anchorObject.getLocation();

        if(!anchorLocation)
        {
            return {
                location: movement.location,
                targetLocation: movement.targetLocation,
                duration: movement.duration,
                elapsed: movement.elapsed,
                anchorObject: null,
                anchorOffset: null
            };
        }

        return {
            location: new Vector3d(anchorLocation.x, anchorLocation.y, anchorLocation.z),
            targetLocation: movement.targetLocation,
            duration: Math.max(1, movement.duration - Math.max(0, movement.elapsed)),
            elapsed: 0,
            anchorObject,
            anchorOffset: new Vector3d(0, 0, movement.location.z - anchorLocation.z)
        };
    }

    private getWiredFurniAnchorObject(movement: WiredFurniMovementData)
    {
        if(!movement || !movement.anchorId) return null;

        switch(movement.anchorType)
        {
            case RoomMessageHandler.WIRED_FURNI_ANCHOR_USER:
                return this._roomEngine.getRoomObjectUser(this._currentRoomId, movement.anchorId);
            case RoomMessageHandler.WIRED_FURNI_ANCHOR_FURNI:
                return this._roomEngine.getRoomObjectFloor(this._currentRoomId, movement.anchorId);
            default:
                return null;
        }
    }

    private applyWiredUserMovement(movement: WiredUserMovementData): void
    {
        const isSlide = (movement.movementType === ObjectRolling.SLIDE);
        this.trackWiredUserMovement(movement);

        this._roomEngine.updateRoomObjectUserLocation(
            this._currentRoomId,
            movement.id,
            movement.location,
            movement.targetLocation,
            false,
            0,
            new Vector3d(movement.bodyDirection),
            movement.headDirection,
            true,
            isSlide,
            movement.duration);

        const object = this._roomEngine.getRoomObjectUser(this._currentRoomId, movement.id);

        if(object && object.type !== RoomObjectUserType.MONSTER_PLANT)
        {
            const posture = (movement.movementType === ObjectRolling.MOVE) ? 'mv' : 'std';

            this._roomEngine.updateRoomObjectUserPosture(this._currentRoomId, movement.id, posture);
        }
    }

    private trackWiredUserMovement(movement: WiredUserMovementData): void
    {
        this._activeWiredUserMovements.set(movement.id, {
            expiresAt: Date.now() + Math.max(movement.duration, 1) + RoomMessageHandler.WIRED_MOVEMENT_STATUS_GRACE,
            sourceX: movement.location.x,
            sourceY: movement.location.y,
            sourceZ: movement.location.z,
            targetX: movement.targetLocation.x,
            targetY: movement.targetLocation.y,
            targetZ: movement.targetLocation.z
        });
    }

    private shouldSuppressWiredStatusLocation(status: RoomUnitStatusMessage): boolean
    {
        const activeMovement = this._activeWiredUserMovements.get(status.id);

        if(!activeMovement) return false;

        if(activeMovement.expiresAt <= Date.now())
        {
            this._activeWiredUserMovements.delete(status.id);

            return false;
        }

        if(this.shouldDiscardWiredStatusLocation(status, activeMovement)
            || !!this.getMatchedWiredStatusTargetLocation(status, activeMovement))
        {
            this._activeWiredUserMovements.delete(status.id);

            return false;
        }

        return true;
    }

    private getReleasedWiredStatusLocation(status: RoomUnitStatusMessage): IVector3D
    {
        const activeMovement = this._activeWiredUserMovements.get(status.id);

        if(!activeMovement) return null;

        if(activeMovement.expiresAt <= Date.now()) return null;

        if(this.shouldDiscardWiredStatusLocation(status, activeMovement)) return null;

        return this.getMatchedWiredStatusTargetLocation(status, activeMovement);
    }

    private getMatchedWiredStatusTargetLocation(status: RoomUnitStatusMessage, activeMovement: { expiresAt: number, sourceX: number, sourceY: number, sourceZ: number, targetX: number, targetY: number, targetZ: number }): IVector3D
    {
        if(this.matchesWiredMovementTarget(status.x, status.y, (status.z + status.height), activeMovement))
        {
            return new Vector3d(activeMovement.targetX, activeMovement.targetY, activeMovement.targetZ);
        }

        if(status.didMove && this.matchesWiredMovementTarget(status.targetX, status.targetY, status.targetZ, activeMovement))
        {
            return new Vector3d(activeMovement.targetX, activeMovement.targetY, activeMovement.targetZ);
        }

        return null;
    }

    private shouldDiscardWiredStatusLocation(status: RoomUnitStatusMessage, activeMovement: { expiresAt: number, sourceX: number, sourceY: number, sourceZ: number, targetX: number, targetY: number, targetZ: number }): boolean
    {
        if(!status.didMove)
        {
            return !this.matchesWiredMovementSource(status.x, status.y, (status.z + status.height), activeMovement)
                && !this.matchesWiredMovementTarget(status.x, status.y, (status.z + status.height), activeMovement);
        }

        return !this.matchesWiredMovementSource(status.x, status.y, (status.z + status.height), activeMovement)
            && !this.matchesWiredMovementTarget(status.x, status.y, (status.z + status.height), activeMovement)
            && !this.matchesWiredMovementSource(status.targetX, status.targetY, status.targetZ, activeMovement)
            && !this.matchesWiredMovementTarget(status.targetX, status.targetY, status.targetZ, activeMovement);
    }

    private matchesWiredMovementSource(x: number, y: number, z: number, activeMovement: { expiresAt: number, sourceX: number, sourceY: number, sourceZ: number, targetX: number, targetY: number, targetZ: number }): boolean
    {
        if(!activeMovement) return false;

        return this.matchesWiredMovementLocation(x, y, z, activeMovement.sourceX, activeMovement.sourceY, activeMovement.sourceZ);
    }

    private matchesWiredMovementTarget(x: number, y: number, z: number, activeMovement: { expiresAt: number, sourceX: number, sourceY: number, sourceZ: number, targetX: number, targetY: number, targetZ: number }): boolean
    {
        if(!activeMovement) return false;

        return this.matchesWiredMovementLocation(x, y, z, activeMovement.targetX, activeMovement.targetY, activeMovement.targetZ);
    }

    private matchesWiredMovementLocation(x: number, y: number, z: number, movementX: number, movementY: number, movementZ: number): boolean
    {
        return ((x === movementX)
            && (y === movementY)
            && (Math.abs(z - movementZ) <= RoomMessageHandler.WIRED_MOVEMENT_Z_EPSILON));
    }

    private applyWiredUserDirectionUpdate(update: WiredUserDirectionUpdateData): void
    {
        const userObject = this._roomEngine.getRoomObjectUser(this._currentRoomId, update.id);

        if(!userObject) return;

        userObject.setDirection(new Vector3d(update.bodyDirection));

        const model = userObject.model;

        if(!model) return;

        model.setValue(RoomObjectVariable.HEAD_DIRECTION, update.headDirection);
    }

    private onObjectsDataUpdateEvent(event: ObjectsDataUpdateEvent): void
    {
        if(!(event instanceof ObjectsDataUpdateEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        for(const object of parser.objects)
        {
            this._roomEngine.updateRoomObjectFloor(this._currentRoomId, object.id, null, null, object.state, object.data);
        }

        this.applyConfInvisStateToFloorObjects();
        this.applyAreaHideStateToFloorObjects();
    }

    private onFurnitureAliasesEvent(event: FurnitureAliasesEvent): void
    {
        if(!(event instanceof FurnitureAliasesEvent) || !event.connection || !this._roomEngine) return;

        const alises = event.getParser().aliases;

        this._connection.send(new GetRoomEntryDataMessageComposer());
    }

    private onFurnitureFloorAddEvent(event: FurnitureFloorAddEvent): void
    {
        if(!(event instanceof FurnitureFloorAddEvent) || !event.connection || !this._roomEngine) return;

        const item = event.getParser().item;

        if(!item) return;

        this.addRoomObjectFurnitureFloor(this._currentRoomId, item);
        this.applyConfInvisStateToFloorObjects([ item.itemId ]);
        this.applyAreaHideStateToFloorObjects([ item.itemId ]);
    }

    private onFurnitureFloorEvent(event: FurnitureFloorEvent): void
    {
        if(!(event instanceof FurnitureFloorEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        const totalObjects = parser.items.length;

        let iterator = 0;

        while(iterator < totalObjects)
        {
            const object = parser.items[iterator];

            if(object) this.addRoomObjectFurnitureFloor(this._currentRoomId, object);

            iterator++;
        }

        this.applyConfInvisStateToFloorObjects();
        this.applyAreaHideStateToFloorObjects();
        this.scheduleAreaHideReapply(this._currentRoomId);
    }

    private onFurnitureFloorRemoveEvent(event: FurnitureFloorRemoveEvent): void
    {
        if(!(event instanceof FurnitureFloorRemoveEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        if(parser.delay > 0)
        {
            setTimeout(() =>
            {
                this._activeConfInvisHiddenItemIds.delete(parser.itemId);
                this._activeAreaHideControllers.delete(parser.itemId);
                this._roomEngine.removeRoomObjectFloor(this._currentRoomId, parser.itemId, (parser.isExpired) ? -1 : parser.userId, true);
                this.applyAreaHideStateToRoomObjects();
            }, parser.delay);
        }
        else
        {
            this._activeConfInvisHiddenItemIds.delete(parser.itemId);
            this._activeAreaHideControllers.delete(parser.itemId);
            this._roomEngine.removeRoomObjectFloor(this._currentRoomId, parser.itemId, (parser.isExpired) ? -1 : parser.userId, true);
            this.applyAreaHideStateToRoomObjects();
        }
    }

    private onFurnitureFloorUpdateEvent(event: FurnitureFloorUpdateEvent): void
    {
        if(!(event instanceof FurnitureFloorUpdateEvent) || !event.connection || !this._roomEngine) return;

        const item = event.getParser().item;

        if(!item) return;

        const location: IVector3D = new Vector3d(item.x, item.y, item.z);
        const direction: IVector3D = new Vector3d(item.direction);

        this._roomEngine.updateRoomObjectFloor(this._currentRoomId, item.itemId, location, direction, item.data.state, item.data, item.extra);
        this._roomEngine.updateRoomObjectFloorHeight(this._currentRoomId, item.itemId, item.stackHeight);
        this._roomEngine.updateRoomObjectFloorExpiration(this._currentRoomId, item.itemId, item.expires);
        this.applyConfInvisStateToFloorObjects([ item.itemId ]);
        this.applyAreaHideStateToFloorObjects([ item.itemId ]);
    }

    private onConfInvisStateMessageEvent(event: ConfInvisStateMessageEvent): void
    {
        if(!(event instanceof ConfInvisStateMessageEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser?.stateData) return;
        if(parser.stateData.roomId !== this._currentRoomId) return;

        this._isConfInvisControlActive = parser.stateData.active;
        this._activeConfInvisHiddenItemIds = new Set<number>(parser.stateData.hiddenItemIds);
        this.applyConfInvisStateToFloorObjects();
        this.applyAreaHideStateToRoomObjects();
        this.scheduleConfInvisReapply(parser.stateData.roomId);
        this.scheduleAreaHideReapply(parser.stateData.roomId);
    }

    private applyConfInvisStateToFloorObjects(itemIds?: number[]): void
    {
        const floorObjects = ((this._roomEngine as any)?.getRoomObjects?.(this._currentRoomId, RoomObjectCategory.FLOOR) as IRoomObject[]) ?? [];

        if(!floorObjects?.length) return;

        const scopedIds = itemIds?.length ? new Set<number>(itemIds) : null;

        for(const roomObject of floorObjects)
        {
            if(!roomObject?.model) continue;
            if(scopedIds && !scopedIds.has(roomObject.id)) continue;

            roomObject.model.setValue(RoomObjectVariable.FURNITURE_CONF_INVIS_HIDDEN, this._activeConfInvisHiddenItemIds.has(roomObject.id) ? 1 : 0);
        }
    }

    private scheduleConfInvisReapply(roomId: number): void
    {
        this.clearConfInvisReapplyTimeouts();

        const retryDelays = [ 0, 50, 150, 300, 600, 1000 ];

        for(const delay of retryDelays)
        {
            const timeout = setTimeout(() =>
            {
                if(roomId !== this._currentRoomId) return;

                this.applyConfInvisStateToFloorObjects();
            }, delay);

            this._confInvisReapplyTimeouts.push(timeout);
        }
    }

    private clearConfInvisReapplyTimeouts(): void
    {
        if(!this._confInvisReapplyTimeouts.length) return;

        for(const timeout of this._confInvisReapplyTimeouts)
        {
            clearTimeout(timeout);
        }

        this._confInvisReapplyTimeouts = [];
    }

    private onFurnitureWallAddEvent(event: FurnitureWallAddEvent): void
    {
        if(!(event instanceof FurnitureWallAddEvent) || !event.connection || !this._roomEngine) return;

        const data = event.getParser().item;

        if(!data) return;

        this.addRoomObjectFurnitureWall(this._currentRoomId, data);
        this.applyAreaHideStateToWallObjects([ data.itemId ]);
    }

    private onFurnitureWallEvent(event: FurnitureWallEvent): void
    {
        if(!(event instanceof FurnitureWallEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        const totalObjects = parser.items.length;

        let iterator = 0;

        while(iterator < totalObjects)
        {
            const data = parser.items[iterator];

            if(data) this.addRoomObjectFurnitureWall(this._currentRoomId, data);

            iterator++;
        }

        this.applyAreaHideStateToWallObjects();
        this.scheduleAreaHideReapply(this._currentRoomId);
    }

    private onFurnitureWallRemoveEvent(event: FurnitureWallRemoveEvent): void
    {
        if(!(event instanceof FurnitureWallRemoveEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        this._roomEngine.removeRoomObjectWall(this._currentRoomId, parser.itemId, parser.userId);
        this.applyAreaHideStateToWallObjects();
    }

    private onFurnitureWallUpdateEvent(event: FurnitureWallUpdateEvent): void
    {
        if(!(event instanceof FurnitureWallUpdateEvent) || !event.connection || !this._roomEngine) return;

        const wallGeometry = this._roomEngine.getLegacyWallGeometry(this._currentRoomId);

        if(!wallGeometry) return;

        const item = event.getParser().item;

        if(!item) return;

        const location = wallGeometry.getLocation(item.width, item.height, item.localX, item.localY, item.direction);
        const direction = new Vector3d(wallGeometry.getDirection(item.direction));

        this._roomEngine.updateRoomObjectWall(this._currentRoomId, item.itemId, location, direction, item.state, item.stuffData);
        this._roomEngine.updateRoomObjectWallExpiration(this._currentRoomId, item.itemId, item.secondsToExpiration);
        this.applyAreaHideStateToWallObjects([ item.itemId ]);
    }

    private onFurnitureDataEvent(event: FurnitureDataEvent): void
    {
        if(!(event instanceof FurnitureDataEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        this._roomEngine.updateRoomObjectFloor(this._currentRoomId, parser.furnitureId, null, null, parser.objectData.state, parser.objectData);
        this.applyConfInvisStateToFloorObjects([ parser.furnitureId ]);
        this.applyAreaHideStateToFloorObjects([ parser.furnitureId ]);
    }

    private onItemDataUpdateMessageEvent(event: ItemDataUpdateMessageEvent): void
    {
        if(!(event instanceof ItemDataUpdateMessageEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        this._roomEngine.updateRoomObjectWallItemData(this._currentRoomId, parser.furnitureId, parser.data);
        this.applyAreaHideStateToWallObjects([ parser.furnitureId ]);
    }

    private onOneWayDoorStatusMessageEvent(event: OneWayDoorStatusMessageEvent): void
    {
        if(!(event instanceof OneWayDoorStatusMessageEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        this._roomEngine.updateRoomObjectFloor(this._currentRoomId, parser.itemId, null, null, parser.state, new LegacyDataType());
        this.applyConfInvisStateToFloorObjects([ parser.itemId ]);
        this.applyAreaHideStateToFloorObjects([ parser.itemId ]);
    }

    private onAreaHideMessageEvent(event: AreaHideMessageEvent): void
    {
        if(!(event instanceof AreaHideMessageEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();
        const areaData = parser.areaData;

        this._roomEngine.updateAreaHide(this._currentRoomId, areaData.furniId, areaData.on, areaData.rootX, areaData.rootY, areaData.width, areaData.length, areaData.invert);

        if(areaData.on)
        {
            this._activeAreaHideControllers.set(areaData.furniId, {
                rootX: areaData.rootX,
                rootY: areaData.rootY,
                width: areaData.width,
                length: areaData.length,
                invert: areaData.invert,
                wallItems: areaData.wallItems,
                invisibility: areaData.invisibility
            });
        }
        else
        {
            this._activeAreaHideControllers.delete(areaData.furniId);
        }

        this.applyAreaHideStateToRoomObjects();
        this.scheduleAreaHideReapply(this._currentRoomId);
    }

    private onDiceValueMessageEvent(event: DiceValueMessageEvent): void
    {
        if(!(event instanceof DiceValueMessageEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        this._roomEngine.updateRoomObjectFloor(this._currentRoomId, parser.itemId, null, null, parser.value, new LegacyDataType());
        this.applyConfInvisStateToFloorObjects([ parser.itemId ]);
        this.applyAreaHideStateToFloorObjects([ parser.itemId ]);
    }

    private applyAreaHideStateToRoomObjects(floorItemIds?: number[], wallItemIds?: number[]): void
    {
        this.applyAreaHideStateToFloorObjects(floorItemIds);
        this.applyAreaHideStateToWallObjects(wallItemIds);
    }

    private applyAreaHideStateToFloorObjects(itemIds?: number[]): void
    {
        const floorObjects = ((this._roomEngine as any)?.getRoomObjects?.(this._currentRoomId, RoomObjectCategory.FLOOR) as IRoomObject[]) ?? [];

        if(!floorObjects?.length) return;

        const scopedIds = itemIds?.length ? new Set<number>(itemIds) : null;

        for(const roomObject of floorObjects)
        {
            if(!roomObject?.model) continue;
            if(scopedIds && !scopedIds.has(roomObject.id)) continue;

            roomObject.model.setValue(RoomObjectVariable.FURNITURE_AREA_HIDE_HIDDEN, this.shouldHideRoomObjectByAreaHide(roomObject, RoomObjectCategory.FLOOR) ? 1 : 0);
        }
    }

    private applyAreaHideStateToWallObjects(itemIds?: number[]): void
    {
        const wallObjects = ((this._roomEngine as any)?.getRoomObjects?.(this._currentRoomId, RoomObjectCategory.WALL) as IRoomObject[]) ?? [];

        if(!wallObjects?.length) return;

        const scopedIds = itemIds?.length ? new Set<number>(itemIds) : null;

        for(const roomObject of wallObjects)
        {
            if(!roomObject?.model) continue;
            if(scopedIds && !scopedIds.has(roomObject.id)) continue;

            roomObject.model.setValue(RoomObjectVariable.FURNITURE_AREA_HIDE_HIDDEN, this.shouldHideRoomObjectByAreaHide(roomObject, RoomObjectCategory.WALL) ? 1 : 0);
        }
    }

    private shouldHideRoomObjectByAreaHide(roomObject: IRoomObject, category: number): boolean
    {
        if(!roomObject?.model) return false;

        const controllerState = this.getAreaHideControllerStateFromObject(roomObject, category);

        if(controllerState)
        {
            return (controllerState.invisibility && this._isConfInvisControlActive);
        }

        if(!this._activeAreaHideControllers.size) return false;

        for(const activeState of this._activeAreaHideControllers.values())
        {
            if((activeState.width <= 0) || (activeState.length <= 0)) continue;
            if((category === RoomObjectCategory.WALL) && !activeState.wallItems) continue;

            const intersectsArea = (category === RoomObjectCategory.WALL)
                ? this.isWallObjectInsideArea(roomObject, activeState)
                : this.doesFloorObjectIntersectArea(roomObject, activeState);
            const shouldHide = (activeState.invert ? !intersectsArea : intersectsArea);

            if(shouldHide) return true;
        }

        return false;
    }

    private doesFloorObjectIntersectArea(roomObject: IRoomObject, areaState: AreaHideControllerState): boolean
    {
        if(!roomObject?.model) return false;

        const location = roomObject.getLocation();

        if(!location) return false;

        let sizeX = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_X);
        let sizeY = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Y);

        if(!sizeX || (sizeX < 1)) sizeX = 1;
        if(!sizeY || (sizeY < 1)) sizeY = 1;

        const direction = roomObject.getDirection();
        const directionQuarterTurns = (((Math.trunc(((direction?.x ?? 0) + 45)) % 360) + 360) % 360) / 90;

        if((directionQuarterTurns === 1) || (directionQuarterTurns === 3))
        {
            [ sizeX, sizeY ] = [ sizeY, sizeX ];
        }

        const objectMinX = location.x;
        const objectMinY = location.y;
        const objectMaxX = objectMinX + sizeX;
        const objectMaxY = objectMinY + sizeY;
        const areaMinX = areaState.rootX;
        const areaMinY = areaState.rootY;
        const areaMaxX = areaMinX + areaState.width;
        const areaMaxY = areaMinY + areaState.length;

        return (objectMinX < areaMaxX)
            && (objectMaxX > areaMinX)
            && (objectMinY < areaMaxY)
            && (objectMaxY > areaMinY);
    }

    private isWallObjectInsideArea(roomObject: IRoomObject, areaState: AreaHideControllerState): boolean
    {
        const location = roomObject?.getLocation();

        if(!location) return false;

        const xCandidates = Array.from(new Set([ Math.floor(location.x), Math.ceil(location.x), Math.round(location.x) ]));
        const yCandidates = Array.from(new Set([ Math.floor(location.y), Math.ceil(location.y), Math.round(location.y) ]));

        for(const x of xCandidates)
        {
            for(const y of yCandidates)
            {
                if((x >= areaState.rootX)
                    && (x < (areaState.rootX + areaState.width))
                    && (y >= areaState.rootY)
                    && (y < (areaState.rootY + areaState.length)))
                {
                    return true;
                }
            }
        }

        return false;
    }

    private getAreaHideControllerStateFromObject(roomObject: IRoomObject, category: number): AreaHideControllerState
    {
        if(!roomObject?.model || (category !== RoomObjectCategory.FLOOR)) return null;

        if(this._activeAreaHideControllers.has(roomObject.id))
        {
            return this._activeAreaHideControllers.get(roomObject.id);
        }

        if(!this.isAreaHideControllerObject(roomObject)) return null;

        return {
            rootX: (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_AREA_HIDE_ROOT_X) ?? 0),
            rootY: (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_AREA_HIDE_ROOT_Y) ?? 0),
            width: (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_AREA_HIDE_WIDTH) ?? 0),
            length: (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_AREA_HIDE_LENGTH) ?? 0),
            invert: (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_AREA_HIDE_INVERT) === 1),
            wallItems: (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_AREA_HIDE_WALL_ITEMS) === 1),
            invisibility: (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_AREA_HIDE_INVISIBILITY) === 1)
        };
    }

    private isAreaHideControllerObject(roomObject: IRoomObject): boolean
    {
        if(!roomObject?.model) return false;

        const furniData = GetSessionDataManager().getFloorItemDataByName(roomObject.type);
        const customParams = (furniData?.customParams || '').toLowerCase();

        if(customParams.includes('area_hide_control') || customParams.includes('wf_conf_area_hide') || customParams.includes('conf_area_hide'))
        {
            return true;
        }

        const stuffData = roomObject.model.getValue<number[]>(RoomObjectVariable.FURNITURE_DATA);

        return Array.isArray(stuffData) && (stuffData.length >= 8);
    }

    private scheduleAreaHideReapply(roomId: number): void
    {
        this.clearAreaHideReapplyTimeouts();

        const retryDelays = [ 0, 50, 150, 300, 600, 1000 ];

        for(const delay of retryDelays)
        {
            const timeout = setTimeout(() =>
            {
                if(roomId !== this._currentRoomId) return;

                this.applyAreaHideStateToRoomObjects();
            }, delay);

            this._areaHideReapplyTimeouts.push(timeout);
        }
    }

    private clearAreaHideReapplyTimeouts(): void
    {
        if(!this._areaHideReapplyTimeouts.length) return;

        for(const timeout of this._areaHideReapplyTimeouts)
        {
            clearTimeout(timeout);
        }

        this._areaHideReapplyTimeouts = [];
    }

    private onRoomUnitDanceEvent(event: RoomUnitDanceEvent): void
    {
        if(!(event instanceof RoomUnitDanceEvent) || !event.connection || !this._roomEngine) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, event.getParser().unitId, RoomObjectVariable.FIGURE_DANCE, event.getParser().danceId);
    }

    private onRoomUnitEffectEvent(event: RoomUnitEffectEvent): void
    {
        if(!(event instanceof RoomUnitEffectEvent) || !event.connection || !this._roomEngine) return;

        this._roomEngine.updateRoomObjectUserEffect(this._currentRoomId, event.getParser().unitId, event.getParser().effectId, event.getParser().delay);
    }

    private onRoomUnitEvent(event: RoomUnitEvent): void
    {
        if(!(event instanceof RoomUnitEvent) || !event.connection || !this._roomEngine) return;

        const users = event.getParser().users;

        if(!users || !users.length) return;

        for(const user of users)
        {
            if(!user) continue;

            const location = new Vector3d(user.x, user.y, user.z);
            const direction = new Vector3d(user.dir);

            if(user.webID > 0)
            {
                const identity = `${ user.userType }_${ user.webID }`;
                const previousRoomIndex = this._roomUnitIndexByIdentity.get(identity);

                if((previousRoomIndex !== undefined) && (previousRoomIndex !== user.roomIndex))
                {
                    this._activeRoomUserWalks.delete(previousRoomIndex);
                    this._jumpingUnitIds.delete(previousRoomIndex);
                    this._roomEngine.removeRoomObjectUser(this._currentRoomId, previousRoomIndex);
                }

                this._roomUnitIndexByIdentity.set(identity, user.roomIndex);
            }

            this._roomEngine.addRoomObjectUser(this._currentRoomId, user.roomIndex, location, direction, user.dir, user.userType, user.figure);

            if(user.webID === this._ownUserId)
            {
                this._ownRoomIndex = user.roomIndex;
                this._roomEngine.setRoomSessionOwnUser(this._currentRoomId, user.roomIndex);
                this._roomEngine.updateRoomObjectUserOwn(this._currentRoomId, user.roomIndex);
            }

            this._roomEngine.updateRoomObjectUserFigure(this._currentRoomId, user.roomIndex, user.figure, user.sex, user.subType, user.isRiding);

            if(RoomObjectUserType.getTypeString(user.userType) === RoomObjectUserType.PET)
            {
                if(this._roomEngine.getPetTypeId(user.figure) === PetType.MONSTERPLANT)
                {
                    this._roomEngine.updateRoomObjectUserPosture(this._currentRoomId, user.roomIndex, user.petPosture);
                }
            }

            this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, user.roomIndex, RoomObjectVariable.FIGURE_IS_MUTED, (GetSessionDataManager().isUserIgnored(user.name) ? 1 : 0));
        }

        this.updateGuideMarker();
    }

    private onRoomUnitExpressionEvent(event: RoomUnitExpressionEvent): void
    {
        if(!(event instanceof RoomUnitExpressionEvent) || !event.connection || !this._roomEngine) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, event.getParser().unitId, RoomObjectVariable.FIGURE_EXPRESSION, event.getParser().expression);
    }

    private onRoomUnitHabbiconEvent(event: RoomUnitHabbiconEvent): void
    {
        if(!(event instanceof RoomUnitHabbiconEvent) || !event.connection || !this._roomEngine) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, event.getParser().unitId, RoomObjectVariable.FIGURE_HABBICON, event.getParser().habbiconId);
    }

    private onRoomUnitHandItemEvent(event: RoomUnitHandItemEvent): void
    {
        if(!(event instanceof RoomUnitHandItemEvent) || !event.connection || !this._roomEngine) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, event.getParser().unitId, RoomObjectVariable.FIGURE_CARRY_OBJECT, event.getParser().handId);
    }

    private onRoomUnitIdleEvent(event: RoomUnitIdleEvent): void
    {
        if(!(event instanceof RoomUnitIdleEvent) || !event.connection || !this._roomEngine) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, event.getParser().unitId, RoomObjectVariable.FIGURE_SLEEP, (event.getParser().isIdle ? 1 : 0));
    }

    private onRoomUnitInfoEvent(event: RoomUnitInfoEvent): void
    {
        if(!(event instanceof RoomUnitInfoEvent) || !event.connection || !this._roomEngine) return;

        this._roomEngine.updateRoomObjectUserFigure(this._currentRoomId, event.getParser().unitId, event.getParser().figure, event.getParser().gender);
    }

    private onRoomUnitNumberEvent(event: RoomUnitNumberEvent): void
    {
        if(!(event instanceof RoomUnitNumberEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, parser.unitId, RoomObjectVariable.FIGURE_NUMBER_VALUE, parser.value);
    }

    private onRoomUnitRemoveEvent(event: RoomUnitRemoveEvent): void
    {
        if(!(event instanceof RoomUnitRemoveEvent) || !event.connection || !this._roomEngine) return;

        const unitId = event.getParser().unitId;

        this._activeRoomUserWalks.delete(unitId);
        this._jumpingUnitIds.delete(unitId);

        for(const [identity, roomIndex] of this._roomUnitIndexByIdentity)
        {
            if(roomIndex === unitId)
            {
                this._roomUnitIndexByIdentity.delete(identity);

                break;
            }
        }

        this._roomEngine.removeRoomObjectUser(this._currentRoomId, unitId);

        this.updateGuideMarker();
    }

    private onRoomUnitStatusEvent(event: RoomUnitStatusEvent): void
    {
        if(!(event instanceof RoomUnitStatusEvent) || !event.connection || !this._roomEngine) return;

        const statuses = event.getParser().statuses;

        if(!statuses || !statuses.length) return;

        const roomInstance = this._roomEngine.getRoomInstance(this._currentRoomId);

        if(!roomInstance) return;

        const zScale = (roomInstance.model.getValue<number>(RoomVariableEnum.ROOM_Z_SCALE) || 1);

        for(const status of statuses)
        {
            if(!status) continue;

            let height = status.height;

            if(height) height = (height / zScale);

            const releasedWiredLocation = this.getReleasedWiredStatusLocation(status);
            const location = (releasedWiredLocation || new Vector3d(status.x, status.y, (status.z + height)));
            const direction = new Vector3d(status.direction);

            let goal: IVector3D = null;

            if(status.didMove) goal = new Vector3d(status.targetX, status.targetY, status.targetZ);

            this.trackRoomUserWalkStatus(status);

            if(!this.shouldSuppressWiredStatusLocation(status))
            {
                this._roomEngine.updateRoomObjectUserLocation(this._currentRoomId, status.id, location, goal, status.canStandUp, height, direction, status.headDirection);
            }

            this._roomEngine.updateRoomObjectUserFlatControl(this._currentRoomId, status.id, null);

            // Save own user's position for reconnection
            if(status.id === this._ownRoomIndex)
            {
                try
                {
                    sessionStorage.setItem('nitro.session.lastPosX', status.x.toString());
                    sessionStorage.setItem('nitro.session.lastPosY', status.y.toString());
                }
                catch (e)
                { /* ignore */ }
            }

            let isPosture = true;
            let postureUpdate = false;
            let postureType = RoomObjectVariable.STD;
            let parameter = '';
            let moveUpdate = false;
            let swimUpdate = false;
            let jumpPosture = null;
            let jumpParameter = '';

            if(status.actions && status.actions.length)
            {
                for(const action of status.actions)
                {
                    if(!action) continue;

                    switch(action.action)
                    {
                        case 'flatctrl':
                            this._roomEngine.updateRoomObjectUserFlatControl(this._currentRoomId, status.id, action.value);
                            break;
                        case 'sign':
                            if(status.actions.length === 1) isPosture = false;

                            this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, status.id, RoomObjectVariable.FIGURE_SIGN, parseInt(action.value));
                            break;
                        case 'gst':
                            if(status.actions.length === 1) isPosture = false;

                            this._roomEngine.updateRoomObjectUserPetGesture(this._currentRoomId, status.id, action.value);
                            break;
                        case 'wav':
                        case 'mv':
                            moveUpdate = true;
                            postureUpdate = true;
                            postureType = action.action;
                            parameter = action.value;
                            break;
                        case 'swim':
                            swimUpdate = true;
                            postureUpdate = true;
                            postureType = action.action;
                            parameter = action.value;
                            break;
                        case 'trd': break;
                        case 'jmp':
                        case 'jmp-in':
                        case 'jmp-out':
                            jumpPosture = action.action;
                            jumpParameter = action.value;
                            postureUpdate = true;
                            postureType = action.action;
                            parameter = action.value;
                            break;
                        default:
                            postureUpdate = true;
                            postureType = action.action;
                            parameter = action.value;
                            break;
                    }
                }
            }

            if(!moveUpdate && swimUpdate)
            {
                postureUpdate = true;
                postureType = 'float';
            }

            if(jumpPosture !== null)
            {
                postureUpdate = true;
                postureType = jumpPosture;
                parameter = jumpParameter;

                this._jumpingUnitIds.add(status.id);
            }
            else if(this._jumpingUnitIds.delete(status.id) && !postureUpdate)
            {
                postureUpdate = true;
                postureType = RoomObjectVariable.STD;
                parameter = '';
            }

            if(postureUpdate) this._roomEngine.updateRoomObjectUserPosture(this._currentRoomId, status.id, postureType, parameter);
            else if(isPosture) this._roomEngine.updateRoomObjectUserPosture(this._currentRoomId, status.id, RoomObjectVariable.STD, '');
        }

        this.updateGuideMarker();
    }

    private trackRoomUserWalkStatus(status: RoomUnitStatusMessage): void
    {
        if(!status) return;

        if(status.didMove)
        {
            this._activeRoomUserWalks.set(status.id, {
                startedAt: Date.now(),
                targetX: status.targetX,
                targetY: status.targetY,
                targetZ: status.targetZ,
                duration: RoomMessageHandler.ROOM_USER_WALK_DURATION
            });

            return;
        }

        const activeWalk = this._activeRoomUserWalks.get(status.id);

        if(activeWalk)
        {
            const walkExpiresAt = (activeWalk.startedAt + activeWalk.duration + RoomMessageHandler.WIRED_MOVEMENT_STATUS_GRACE);
            const reachedTrackedTarget = ((status.x === activeWalk.targetX)
                && (status.y === activeWalk.targetY)
                && (Math.abs(status.z - activeWalk.targetZ) <= RoomMessageHandler.WIRED_MOVEMENT_Z_EPSILON));

            if(reachedTrackedTarget && (Date.now() < walkExpiresAt)) return;
        }

        this._activeRoomUserWalks.delete(status.id);
    }

    private getActiveRoomUserWalk(id: number): { startedAt: number, targetX: number, targetY: number, targetZ: number, duration: number }
    {
        const activeWalk = this._activeRoomUserWalks.get(id);

        if(!activeWalk) return null;

        const walkExpiresAt = (activeWalk.startedAt + activeWalk.duration + RoomMessageHandler.WIRED_MOVEMENT_STATUS_GRACE);

        if(Date.now() >= walkExpiresAt)
        {
            this._activeRoomUserWalks.delete(id);

            return null;
        }

        return activeWalk;
    }

    private onRoomUnitChatEvent(event: RoomUnitChatEvent): void
    {
        if(!event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        this._roomEngine.updateRoomObjectUserGesture(this._currentRoomId, parser.roomIndex, parser.gesture);
        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, parser.roomIndex, RoomObjectVariable.FIGURE_TALK, (parser.message.length / 10));
    }

    private onRoomUnitTypingEvent(event: RoomUnitTypingEvent): void
    {
        if(!(event instanceof RoomUnitTypingEvent) || !event.connection || !this._roomEngine) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, event.getParser().unitId, RoomObjectVariable.FIGURE_IS_TYPING, event.getParser().isTyping ? 1 : 0);
    }

    private onPetFigureUpdateEvent(event: PetFigureUpdateEvent): void
    {
        if(!(event instanceof PetFigureUpdateEvent) || !event.connection || !this._roomEngine) return;

        const parser = event.getParser();

        if(!parser) return;

        this._roomEngine.updateRoomObjectUserFigure(this._currentRoomId, parser.roomIndex, parser.figureData.figuredata, '', '', parser.isRiding);
    }

    private onPetExperienceEvent(event: PetExperienceEvent): void
    {
        const parser = event.getParser();

        if(!parser) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, parser.roomIndex, RoomObjectVariable.FIGURE_GAINED_EXPERIENCE, parser.gainedExperience);
    }

    private onYouArePlayingGameEvent(event: YouArePlayingGameEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        this._roomEngine.setRoomEngineGameMode(this._currentRoomId, parser.isPlaying);
    }

    private addRoomObjectFurnitureFloor(roomId: number, data: FurnitureFloorDataParser): void
    {
        if(!data || !this._roomEngine) return;

        const location = new Vector3d(data.x, data.y, data.z);
        const direction = new Vector3d(data.direction);

        if(data.spriteName)
        {
            this._roomEngine.addFurnitureFloorByTypeName(roomId, data.itemId, data.spriteName, location, direction, data.state, data.data, data.extra, data.expires, data.usagePolicy, data.userId, data.username, true, true, data.stackHeight, data.allowStack, data.allowSit, data.allowLay, data.allowWalk, data.dimensionsX, data.dimensionsY, data.teleportTargetId);
        }
        else
        {
            this._roomEngine.addFurnitureFloor(roomId, data.itemId, data.spriteId, location, direction, data.state, data.data, data.extra, data.expires, data.usagePolicy, data.userId, data.username, true, true, data.stackHeight, data.allowStack, data.allowSit, data.allowLay, data.allowWalk, data.dimensionsX, data.dimensionsY, data.teleportTargetId);
        }
    }

    private addRoomObjectFurnitureWall(roomId: number, data: FurnitureWallDataParser): void
    {
        if(!data || !this._roomEngine) return;

        const wallGeometry = this._roomEngine.getLegacyWallGeometry(roomId);

        if(!wallGeometry) return;

        let location: IVector3D = null;

        if(!data.isOldFormat)
        {
            location = wallGeometry.getLocation(data.width, data.height, data.localX, data.localY, data.direction);
        }
        else
        {
            //location = wallGeometry.getLocationOldFormat(data.y, data.z, data.direction);
        }

        const direction = new Vector3d(wallGeometry.getDirection(data.direction));

        this._roomEngine.addFurnitureWall(roomId, data.itemId, data.spriteId, location, direction, data.state, data.stuffData, data.secondsToExpiration, data.usagePolicy, data.userId, data.username, true, data.allowStack, data.allowSit, data.allowLay, data.allowWalk, data.dimensionsX, data.dimensionsY, data.teleportTargetId);
    }

    private onIgnoreResultEvent(event: IgnoreResultEvent): void
    {
        if(!event) return;

        const parser = event.getParser();

        if(!parser) return;

        const roomSession = GetRoomSessionManager().getSession(this._currentRoomId);

        if(!roomSession) return;

        const userData = roomSession.userDataManager.getUserDataByName(parser.name);

        if(!userData) return;

        switch(parser.result)
        {
            case 1:
            case 2:
                this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, userData.roomIndex, RoomObjectVariable.FIGURE_IS_MUTED, 1);
                return;
            case 3:
                this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, userData.roomIndex, RoomObjectVariable.FIGURE_IS_MUTED, 0);
                return;
        }
    }

    private onGuideSessionStartedMessageEvent(event: GuideSessionStartedMessageEvent): void
    {
        const parser = event.getParser();

        this._guideId = parser.guideUserId;
        this._requesterId = parser.requesterUserId;

        this.updateGuideMarker();
    }

    private onGuideSessionEndedMessageEvent(event: GuideSessionEndedMessageEvent): void
    {
        this.removeGuideMarker();
    }

    private onGuideSessionErrorMessageEvent(event: GuideSessionErrorMessageEvent): void
    {
        this.removeGuideMarker();
    }

    private updateGuideMarker(): void
    {
        const userId = GetSessionDataManager().userId;

        this.setUserGuideStatus(this._guideId, ((this._requesterId === userId) ? AvatarGuideStatus.GUIDE : AvatarGuideStatus.NONE));
        this.setUserGuideStatus(this._requesterId, ((this._guideId === userId) ? AvatarGuideStatus.REQUESTER : AvatarGuideStatus.NONE));
    }

    private removeGuideMarker(): void
    {
        this.setUserGuideStatus(this._guideId, AvatarGuideStatus.NONE);
        this.setUserGuideStatus(this._requesterId, AvatarGuideStatus.NONE);

        this._guideId = -1;
        this._requesterId = -1;
    }

    private setUserGuideStatus(userId: number, status: number): void
    {
        const roomSession = GetRoomSessionManager().getSession(this._currentRoomId);

        if(!roomSession) return;

        const userData = roomSession.userDataManager.getDataByType(userId, RoomObjectType.USER);

        if(!userData) return;

        this._roomEngine.updateRoomObjectUserAction(this._currentRoomId, userData.roomIndex, RoomObjectVariable.FIGURE_GUIDE_STATUS, status);
    }

    public get currentRoomId(): number
    {
        return this._currentRoomId;
    }
}
