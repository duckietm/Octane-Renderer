import { AvatarAction, IGetImageListener, IImageResult, IObjectData, IRoomEngine, IRoomObjectController, IRoomRenderingCanvas, IVector3D, LegacyDataType, RoomObjectCategory, RoomObjectUserType, RoomObjectVariable } from '@nitrots/api';
import { FloorHeightMapMessageParser, RoomEntryTileMessageParser } from '@nitrots/communication';
import { GetEventDispatcher, RoomEngineEvent, RoomEngineObjectEvent } from '@nitrots/events';
import { GetTickerTime, RoomId, Vector3d } from '@nitrots/utils';
import { Container, Point, Rectangle, Sprite, Texture } from 'pixi.js';
import { RoomEngine } from './RoomEngine';
import { ObjectRoomMapUpdateMessage } from './messages';
import { RoomPlaneParser } from './object/RoomPlaneParser';
import { LegacyWallGeometry } from './utils/LegacyWallGeometry';
import { IRoomPreviewCapabilities, RoomPreviewMode } from './RoomPreviewCapabilities';

export class RoomPreviewer
{
    public static SCALE_NORMAL: number = 64;
    public static SCALE_SMALL: number = 32;
    public static PREVIEW_COUNTER: number = 0;
    public static PREVIEW_CANVAS_ID: number = 1;
    public static PREVIEW_OBJECT_ID: number = 1;
    public static PREVIEW_OBJECT_LOCATION_X: number = 2;
    public static PREVIEW_OBJECT_LOCATION_Y: number = 2;
    private static PREVIEW_WALL_ITEM_LOCATION: Vector3d = new Vector3d(0.5, 2.3, 1.8);

    private static ALLOWED_IMAGE_CUT: number = 0.25;
    private static AUTOMATIC_STATE_CHANGE_INTERVAL: number = 2500;
    private static AVATAR_ACTION_COUNT: number = 6;
    private static AVATAR_ACTION_DANCE: number = 2;
    private static AVATAR_ACTION_LAY: number = 4;
    private static AVATAR_ACTION_SIT: number = 3;
    private static AVATAR_ACTION_STAND: number = 0;
    private static AVATAR_ACTION_WALK: number = 1;
    private static AVATAR_ACTION_WAVE: number = 5;
    private static ZOOM_ENABLED: boolean = true;

    private _roomEngine: IRoomEngine;
    private _planeParser: RoomPlaneParser;
    private _previewRoomId: number = 1;
    private _currentPreviewObjectType: number = 0;
    private _currentPreviewObjectCategory: number = 0;
    private _currentPreviewObjectData: string = '';
    private _currentPreviewRectangle: Rectangle = null;
    private _currentPreviewCanvasWidth: number = 0;
    private _currentPreviewCanvasHeight: number = 0;
    private _currentPreviewScale: number = 64;
    private _currentPreviewNeedsZoomOut: boolean;
    private _automaticStateChange: boolean;
    private _currentAvatarAction: number = RoomPreviewer.AVATAR_ACTION_STAND;
    private _currentAvatarDirection: number = 2;
    private _currentAvatarHeadDirection: number = 3;
    private _previousAutomaticStateChangeTime: number;
    private _addViewOffset: Point;
    private _centerWallItems: boolean = false;
    private _backgroundColor: number = 0x000000;
    private _backgroundSprite: Sprite = null;
    private _disableUpdate: boolean = false;
    private _currentPreviewMode: RoomPreviewMode = 'none';
    private _previewCapabilities: IRoomPreviewCapabilities = {
        mode: 'none',
        canRotate: false,
        canChangeState: false,
        canUseAvatarActions: false,
        canZoomIn: false,
        canZoomOut: false
    };
    private _previewCapabilityListeners = new Set<() => void>();

    constructor(roomEngine: IRoomEngine, roomId: number = 1)
    {
        this._roomEngine = roomEngine;
        this._planeParser = new RoomPlaneParser();
        this._previewRoomId = RoomId.makeRoomPreviewerId(roomId);
        this._addViewOffset = new Point(0, 0);

        this.onRoomObjectAdded = this.onRoomObjectAdded.bind(this);
        this.onRoomInitializedonRoomInitialized = this.onRoomInitializedonRoomInitialized.bind(this);

        if(this.isRoomEngineReady && GetEventDispatcher())
        {
            GetEventDispatcher().addEventListener(RoomEngineObjectEvent.ADDED, this.onRoomObjectAdded);
            GetEventDispatcher().addEventListener(RoomEngineObjectEvent.CONTENT_UPDATED, this.onRoomObjectAdded);
            GetEventDispatcher().addEventListener(RoomEngineEvent.INITIALIZED, this.onRoomInitializedonRoomInitialized);
        }

        this.createRoomForPreview();
    }

    public dispose(): void
    {
        this.reset(true);
        this._previewCapabilityListeners.clear();

        if(this.isRoomEngineReady && GetEventDispatcher())
        {
            GetEventDispatcher().removeEventListener(RoomEngineObjectEvent.ADDED, this.onRoomObjectAdded);
            GetEventDispatcher().removeEventListener(RoomEngineObjectEvent.CONTENT_UPDATED, this.onRoomObjectAdded);
            GetEventDispatcher().removeEventListener(RoomEngineEvent.INITIALIZED, this.onRoomInitializedonRoomInitialized);
        }

        if(this._backgroundSprite)
        {
            this._backgroundSprite.destroy();

            this._backgroundSprite = null;
        }

        if(this._planeParser)
        {
            this._planeParser.dispose();

            this._planeParser = null;
        }
    }

    private createRoomForPreview(): void
    {
        if(this.isRoomEngineReady)
        {
            const size = 7;

            const planeParser = new RoomPlaneParser();

            planeParser.initializeTileMap((size + 2), (size + 2));

            let y = 1;

            while(y < (1 + size))
            {
                let x = 1;

                while(x < (1 + size))
                {
                    planeParser.setTileHeight(x, y, 0);

                    x++;
                }

                y++;
            }

            planeParser.initializeFromTileData();

            this._roomEngine.createRoomInstance(this._previewRoomId, planeParser.getMapData());

            planeParser.dispose();
        }
    }

    public reset(skipViewUpdate: boolean): void
    {
        if(this.isRoomEngineReady)
        {
            this._roomEngine.removeRoomObjectFloor(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID);
            this._roomEngine.removeRoomObjectWall(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID);
            this._roomEngine.removeRoomObjectUser(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID);

            if(!skipViewUpdate) this.updatePreviewRoomView();
        }

        this._currentPreviewObjectCategory = RoomObjectCategory.MINIMUM;
        this.resetAvatarPreviewState();
        this.setPreviewMode('none');
    }

    public getPreviewCapabilities(): IRoomPreviewCapabilities
    {
        return this._previewCapabilities;
    }

    public subscribePreviewCapabilities(listener: () => void): () => void
    {
        this._previewCapabilityListeners.add(listener);

        return () => this._previewCapabilityListeners.delete(listener);
    }

    private setPreviewMode(mode: RoomPreviewMode): void
    {
        this._currentPreviewMode = mode;
        this.refreshPreviewCapabilities();
    }

    private refreshPreviewCapabilities(): void
    {
        const isFloorFurniture = (this._currentPreviewMode === 'floor');
        const roomObject = (this._currentPreviewMode === 'none' || !this.isRoomEngineReady)
            ? null
            : this._roomEngine.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);
        const directions = roomObject?.model?.getValue<number[]>(RoomObjectVariable.FURNITURE_ALLOWED_DIRECTIONS) ?? [];
        const hasPreviewObject = !!roomObject;
        const nextCapabilities: IRoomPreviewCapabilities = {
            mode: hasPreviewObject ? this._currentPreviewMode : 'none',
            canRotate: hasPreviewObject && ((this._currentPreviewMode === 'avatar') || (this._currentPreviewMode === 'wall') || (isFloorFurniture && directions.length > 1)),
            canChangeState: (isFloorFurniture || (this._currentPreviewMode === 'wall')) && hasPreviewObject,
            canUseAvatarActions: (this._currentPreviewMode === 'avatar') && hasPreviewObject,
            canZoomIn: hasPreviewObject && (this._currentPreviewScale === RoomPreviewer.SCALE_SMALL),
            canZoomOut: hasPreviewObject && (this._currentPreviewScale === RoomPreviewer.SCALE_NORMAL)
        };

        if(
            (nextCapabilities.mode === this._previewCapabilities.mode) &&
            (nextCapabilities.canRotate === this._previewCapabilities.canRotate) &&
            (nextCapabilities.canChangeState === this._previewCapabilities.canChangeState) &&
            (nextCapabilities.canUseAvatarActions === this._previewCapabilities.canUseAvatarActions) &&
            (nextCapabilities.canZoomIn === this._previewCapabilities.canZoomIn) &&
            (nextCapabilities.canZoomOut === this._previewCapabilities.canZoomOut)
        ) return;

        this._previewCapabilities = nextCapabilities;

        for(const listener of this._previewCapabilityListeners) listener();
    }

    public updatePreviewModel(model: string, wallHeight: number, scale: boolean = true): void
    {
        if(!this._planeParser) return;

        const parser = new FloorHeightMapMessageParser();

        parser.flush();
        parser.parseModel(model, wallHeight, scale);

        //@ts-ignore
        const wallGeometry = (this._roomEngine as IRoomCreator).getLegacyWallGeometry(this._previewRoomId);

        if(!wallGeometry) return;

        this._planeParser.reset();

        const width = parser.width;
        const height = parser.height;

        this._planeParser.initializeTileMap(width, height);

        const entryTile: RoomEntryTileMessageParser = null;

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

        const roomObject = this.getRoomPreviewOwnRoomObject();

        if(roomObject) roomObject.processUpdateMessage(new ObjectRoomMapUpdateMessage(roomMap));
    }

    public addFurnitureIntoRoom(classId: number, direction: IVector3D, objectData: IObjectData = null, extra: string = null): number
    {
        if(!objectData) objectData = new LegacyDataType();

        if(this.isRoomEngineReady)
        {
            if((this._currentPreviewObjectCategory === RoomObjectCategory.FLOOR) && (this._currentPreviewObjectType === classId) && (this._currentPreviewObjectData === (extra || ''))) return RoomPreviewer.PREVIEW_OBJECT_ID;

            this.reset(false);

            this._currentPreviewObjectType = classId;
            this._currentPreviewObjectCategory = RoomObjectCategory.FLOOR;
            this._currentPreviewObjectData = '';

            if(this._roomEngine.addFurnitureFloor(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, classId, new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y, 0), direction, 0, objectData, NaN, -1, 0, -1, '', true, false))
            {
                this._previousAutomaticStateChangeTime = GetTickerTime();
                this._automaticStateChange = true;

                const roomObject = this._roomEngine.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);

                if(roomObject)
                {
                    if(extra) roomObject.model.setValue(RoomObjectVariable.FURNITURE_EXTRAS, extra);

                    this.applyInvisibleLayerState(roomObject);
                }

                this.setPreviewMode('floor');

                this.updatePreviewRoomView();

                return RoomPreviewer.PREVIEW_OBJECT_ID;
            }
        }

        return -1;
    }

    public addWallItemIntoRoom(classId: number, direction: IVector3D, objectData: string): number
    {
        if(this.isRoomEngineReady)
        {
            if((this._currentPreviewObjectCategory === RoomObjectCategory.WALL) && (this._currentPreviewObjectType === classId) && (this._currentPreviewObjectData === objectData)) return RoomPreviewer.PREVIEW_OBJECT_ID;

            this.reset(false);

            this._currentPreviewObjectType = classId;
            this._currentPreviewObjectCategory = RoomObjectCategory.WALL;
            this._currentPreviewObjectData = objectData;

            if(this._roomEngine.addFurnitureWall(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, classId, RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION, direction, 0, objectData, 0, 0, -1, '', false))
            {
                this._previousAutomaticStateChangeTime = GetTickerTime();
                this._automaticStateChange = true;

                const roomObject = this._roomEngine.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);

                if(roomObject) this.applyInvisibleLayerState(roomObject);

                this.setPreviewMode('wall');

                this.updatePreviewRoomView();

                return RoomPreviewer.PREVIEW_OBJECT_ID;
            }
        }

        return -1;
    }

    public addAvatarIntoRoom(figure: string, effect: number): number
    {
        if(this.isRoomEngineReady)
        {
            this.reset(false);

            this._currentPreviewObjectType = 1;
            this._currentPreviewObjectCategory = RoomObjectCategory.UNIT;
            this._currentPreviewObjectData = figure;

            if(this._roomEngine.addRoomObjectUser(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y, 0), new Vector3d(90, 0, 0), 135, RoomObjectUserType.getTypeNumber(RoomObjectUserType.USER), figure))
            {
                this._previousAutomaticStateChangeTime = GetTickerTime();
                this._automaticStateChange = true;
                this.setPreviewMode('avatar');

                this.updateUserGesture(1);
                this.updateUserEffect(effect);
                this.updateUserPosture('std');
            }

            this.updatePreviewRoomView();

            return RoomPreviewer.PREVIEW_OBJECT_ID;
        }

        return -1;
    }

    public addPetIntoRoom(figure: string): number
    {
        if(this.isRoomEngineReady)
        {
            this.reset(false);

            this._currentPreviewObjectType = 1;
            this._currentPreviewObjectCategory = RoomObjectCategory.UNIT;
            this._currentPreviewObjectData = figure;

            if(this._roomEngine.addRoomObjectUser(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y, 0), new Vector3d(90, 0, 0), 90, RoomObjectUserType.getTypeNumber(RoomObjectUserType.PET), figure))
            {
                this._previousAutomaticStateChangeTime = GetTickerTime();
                this._automaticStateChange = false;
                this.setPreviewMode('pet');

                this.updateUserGesture(1);
                this.updateUserPosture('std');
            }

            this.updatePreviewRoomView();

            return RoomPreviewer.PREVIEW_OBJECT_ID;
        }

        return -1;
    }

    public updateUserPosture(type: string, parameter: string = ''): void
    {
        if(this.isRoomEngineReady) this._roomEngine.updateRoomObjectUserPosture(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, type, parameter);
    }

    public updateUserGesture(gestureId: number): void
    {
        if(this.isRoomEngineReady) this._roomEngine.updateRoomObjectUserGesture(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, gestureId);
    }

    public updateUserEffect(effectId: number): void
    {
        if(this.isRoomEngineReady) this._roomEngine.updateRoomObjectUserEffect(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, effectId);
    }

    public updateObjectUserFigure(figure: string, gender: string = null, subType: string = null, isRiding: boolean = false): boolean
    {
        if(this.isRoomEngineReady) return this._roomEngine.updateRoomObjectUserFigure(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, figure, gender, subType, isRiding);

        return false;
    }

    public updateObjectUserAction(action: string, value: number, parameter: string = null): void
    {
        if(this.isRoomEngineReady) this._roomEngine.updateRoomObjectUserAction(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, action, value, parameter);
    }

    public updateObjectStuffData(stuffData: IObjectData): void
    {
        if(this.isRoomEngineReady) this._roomEngine.updateRoomObjectFloor(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, null, null, stuffData.state, stuffData);
    }

    public changeRoomObjectState(): void
    {
        if(this.isRoomEngineReady)
        {
            this._automaticStateChange = false;

            if(this._currentPreviewObjectCategory !== RoomObjectCategory.UNIT)
            {
                this._roomEngine.changeObjectState(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);
                this.updatePreviewRoomView(true);
            }
        }
    }

    public cycleAvatarAction(): void
    {
        if(!this.isRoomEngineReady || (this._currentPreviewMode !== 'avatar')) return;

        let nextAction = this._currentAvatarAction;

        do
        {
            nextAction = (nextAction + 1) % RoomPreviewer.AVATAR_ACTION_COUNT;
        }
        while(!this.isAvatarActionValidForDirection(nextAction, this._currentAvatarDirection));

        this._currentAvatarAction = nextAction;
        this.applyAvatarAction();
    }

    public setAutomaticStateChange(enabled: boolean): void
    {
        this._automaticStateChange = enabled;
    }

    public changeRoomObjectDirection(clockwise: boolean = true): void
    {
        if(this.isRoomEngineReady)
        {
            const roomObject = this._roomEngine.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);

            if(!roomObject) return;

            if(this._currentPreviewMode === 'avatar')
            {
                this.rotateAvatar(clockwise);
                return;
            }

            const direction = this._roomEngine.objectEventHandler.getValidRoomObjectDirection(roomObject, clockwise);

            switch(this._currentPreviewObjectCategory)
            {
                case RoomObjectCategory.FLOOR: {
                    const floorLocation = new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y);
                    const floorDirection = new Vector3d(direction, direction, direction);

                    this._roomEngine.updateRoomObjectFloor(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, floorLocation, floorDirection, null, null);
                    this._currentPreviewRectangle = null;
                    this.updatePreviewRoomView(true);
                    return;
                }
                case RoomObjectCategory.WALL: {
                    const wallDirection = (roomObject.getDirection().x === 90) ? 180 : 90;

                    roomObject.setDirection(new Vector3d(wallDirection));
                    this.updatePreviewWallItemLocation(roomObject);
                    this._currentPreviewRectangle = null;
                    this.updatePreviewRoomView(true);
                    return;
                }
            }
        }
    }

    private checkAutomaticRoomObjectStateChange(): void
    {
        if(this._automaticStateChange)
        {
            const time = GetTickerTime();

            if(time > (this._previousAutomaticStateChangeTime + RoomPreviewer.AUTOMATIC_STATE_CHANGE_INTERVAL))
            {
                this._previousAutomaticStateChangeTime = time;

                if(this.isRoomEngineReady) this._roomEngine.changeObjectState(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);
            }
        }
    }

    public getRoomCanvas(width: number, height: number): Container
    {
        if(this.isRoomEngineReady)
        {
            const displayObject = this._roomEngine.getRoomInstanceDisplay(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, width, height, this._currentPreviewScale);

            if(displayObject && (this._backgroundColor !== null))
            {
                let backgroundSprite = this._backgroundSprite;

                if(!backgroundSprite)
                {
                    backgroundSprite = new Sprite(Texture.WHITE);

                    displayObject.addChildAt(backgroundSprite, 0);
                }

                backgroundSprite.width = width;
                backgroundSprite.height = height;
                backgroundSprite.tint = this._backgroundColor;
            }

            this._roomEngine.setRoomInstanceRenderingCanvasMask(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, true);

            const geometry = this._roomEngine.getRoomInstanceGeometry(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);

            if(geometry) geometry.adjustLocation(new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y, 0), 30);

            this._currentPreviewCanvasWidth = width;
            this._currentPreviewCanvasHeight = height;

            return displayObject;
        }

        return null;
    }

    public modifyRoomCanvas(width: number, height: number): void
    {
        if(this.isRoomEngineReady)
        {
            this._currentPreviewCanvasWidth = width;
            this._currentPreviewCanvasHeight = height;

            if(this._backgroundSprite)
            {
                this._backgroundSprite.width = width;
                this._backgroundSprite.height = height;
            }

            this._roomEngine.initializeRoomInstanceRenderingCanvas(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, width, height);
        }
    }

    public set addViewOffset(point: Point)
    {
        this._addViewOffset = point;
    }

    public get addViewOffset(): Point
    {
        return this._addViewOffset;
    }

    public set centerWallItems(value: boolean)
    {
        this._centerWallItems = value;
    }

    public updatePreviewObjectBoundingRectangle(point: Point = null): void
    {
        if(!point) point = new Point(0, 0);

        const objectBounds = this._roomEngine.getRoomObjectBoundingRectangle(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory, RoomPreviewer.PREVIEW_CANVAS_ID);

        if(objectBounds && point)
        {
            objectBounds.x += -(this._currentPreviewCanvasWidth >> 1);
            objectBounds.y += -(this._currentPreviewCanvasHeight >> 1);

            objectBounds.x += -(point.x);
            objectBounds.y += -(point.y);

            if(!this._currentPreviewRectangle)
            {
                this._currentPreviewRectangle = objectBounds;
            }
            else
            {
                const bounds = this._currentPreviewRectangle.clone().enlarge(objectBounds);

                if(((((bounds.width - this._currentPreviewRectangle.width) > ((this._currentPreviewCanvasWidth - this._currentPreviewRectangle.width) >> 1)) || ((bounds.height - this._currentPreviewRectangle.height) > ((this._currentPreviewCanvasHeight - this._currentPreviewRectangle.height) >> 1))) || (this._currentPreviewRectangle.width < 1)) || (this._currentPreviewRectangle.height < 1)) this._currentPreviewRectangle = bounds;
            }
        }
    }

    private validatePreviewSize(point: Point): Point
    {
        if(((this._currentPreviewRectangle.width < 1) || (this._currentPreviewRectangle.height < 1)))
        {
            return point;
        }

        if(this.isRoomEngineReady)
        {
            const geometry = this._roomEngine.getRoomInstanceGeometry(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);

            if((this._currentPreviewRectangle.width > (this._currentPreviewCanvasWidth * (1 + RoomPreviewer.ALLOWED_IMAGE_CUT))) || (this._currentPreviewRectangle.height > (this._currentPreviewCanvasHeight * (1 + RoomPreviewer.ALLOWED_IMAGE_CUT))))
            {
                if(RoomPreviewer.ZOOM_ENABLED)
                {
                    if(this._roomEngine.getRoomInstanceRenderingCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID) !== 0.5)
                    {
                        this._roomEngine.setRoomInstanceRenderingCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, 0.5, null, null);

                        this._currentPreviewScale = RoomPreviewer.SCALE_SMALL;
                        this._currentPreviewNeedsZoomOut = true;

                        point.x = (point.x >> 1);
                        point.y = (point.y >> 1);

                        this._currentPreviewRectangle.x = (this._currentPreviewRectangle.x >> 2);
                        this._currentPreviewRectangle.y = (this._currentPreviewRectangle.y >> 2);
                        this._currentPreviewRectangle.width = (this._currentPreviewRectangle.width >> 2);
                        this._currentPreviewRectangle.height = (this._currentPreviewRectangle.height >> 2);
                    }
                }
                else
                {
                    if(geometry.isZoomedIn())
                    {
                        geometry.performZoomOut();

                        this._currentPreviewScale = RoomPreviewer.SCALE_SMALL;
                        this._currentPreviewNeedsZoomOut = true;
                    }
                }
            }

            else if(
                !this._currentPreviewNeedsZoomOut &&
                ((this._currentPreviewRectangle.width << 1) < ((this._currentPreviewCanvasWidth * (1 + RoomPreviewer.ALLOWED_IMAGE_CUT)) - 5)) &&
                ((this._currentPreviewRectangle.height << 1) < ((this._currentPreviewCanvasHeight * (1 + RoomPreviewer.ALLOWED_IMAGE_CUT)) - 5))
            )
            {
                if(RoomPreviewer.ZOOM_ENABLED)
                {
                    if(this._roomEngine.getRoomInstanceRenderingCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID) !== 1)
                    {
                        this._roomEngine.setRoomInstanceRenderingCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, 1, null, null);

                        this._currentPreviewScale = RoomPreviewer.SCALE_NORMAL;
                    }
                }
                else
                {
                    if(!geometry.isZoomedIn())
                    {
                        geometry.performZoomIn();

                        this._currentPreviewScale = RoomPreviewer.SCALE_NORMAL;
                    }
                }
            }
        }

        this.refreshPreviewCapabilities();

        return point;
    }

    public zoomIn(): void
    {
        if(this.isRoomEngineReady)
        {
            if(RoomPreviewer.ZOOM_ENABLED)
            {
                this._roomEngine.setRoomInstanceRenderingCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, 1);
            }
            else
            {
                const geometry = this._roomEngine.getRoomInstanceGeometry(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);

                geometry.performZoomIn();
            }
        }

        this._currentPreviewScale = RoomPreviewer.SCALE_NORMAL;
        this._currentPreviewNeedsZoomOut = false;
        this._currentPreviewRectangle = null;
        this.refreshPreviewCapabilities();
        this.updatePreviewRoomView(true);
    }

    public zoomOut(): void
    {
        if(this.isRoomEngineReady)
        {
            if(RoomPreviewer.ZOOM_ENABLED)
            {
                this._roomEngine.setRoomInstanceRenderingCanvasScale(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, 0.5);
            }
            else
            {
                const geometry = this._roomEngine.getRoomInstanceGeometry(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);

                geometry.performZoomOut();
            }
        }

        this._currentPreviewScale = RoomPreviewer.SCALE_SMALL;
        this._currentPreviewNeedsZoomOut = true;
        this._currentPreviewRectangle = null;
        this.refreshPreviewCapabilities();
        this.updatePreviewRoomView(true);
    }

    public updateAvatarDirection(direction: number, headDirection: number): void
    {
        this._currentAvatarDirection = this.normalizeAvatarDirection(direction);
        this._currentAvatarHeadDirection = this.normalizeAvatarDirection(headDirection);
        this.updateAvatarDirectionAndLocation(this._currentAvatarDirection, this._currentAvatarHeadDirection);
    }

    public updateAvatarDirectionAndLocation(direction: number, headDirection: number, location: IVector3D = null): void
    {
        if(!this.isRoomEngineReady) return;

        const avatarLocation = location || new Vector3d(RoomPreviewer.PREVIEW_OBJECT_LOCATION_X, RoomPreviewer.PREVIEW_OBJECT_LOCATION_Y, 0);

        this._roomEngine.updateRoomObjectUserLocation(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, avatarLocation, avatarLocation, false, 0, new Vector3d((direction * 45), 0, 0), (headDirection * 45));
    }

    private resetAvatarPreviewState(): void
    {
        this._currentAvatarAction = RoomPreviewer.AVATAR_ACTION_STAND;
        this._currentAvatarDirection = 2;
        this._currentAvatarHeadDirection = 3;
    }

    private normalizeAvatarDirection(direction: number): number
    {
        return ((direction % 8) + 8) % 8;
    }

    private isAvatarActionValidForDirection(action: number, direction: number): boolean
    {
        if(action === RoomPreviewer.AVATAR_ACTION_SIT) return ((direction % 2) === 0);
        if(action === RoomPreviewer.AVATAR_ACTION_LAY) return (direction === 0) || (direction === 2);

        return true;
    }

    private getAvatarActionLocation(): IVector3D
    {
        if(this._currentAvatarAction === RoomPreviewer.AVATAR_ACTION_SIT) return new Vector3d(2, 2, 0.55);
        if(this._currentAvatarAction === RoomPreviewer.AVATAR_ACTION_LAY) return new Vector3d(1, 1, 0);

        return null;
    }

    private applyAvatarAction(): void
    {
        this.updateObjectUserAction(RoomObjectVariable.FIGURE_DANCE, 0);
        this.updateObjectUserAction(RoomObjectVariable.FIGURE_EXPRESSION, 0);

        switch(this._currentAvatarAction)
        {
            case RoomPreviewer.AVATAR_ACTION_WALK:
                this.updateUserPosture(AvatarAction.POSTURE_WALK);
                break;
            case RoomPreviewer.AVATAR_ACTION_DANCE:
                this.updateUserPosture(AvatarAction.POSTURE_STAND);
                this.updateObjectUserAction(RoomObjectVariable.FIGURE_DANCE, 1);
                break;
            case RoomPreviewer.AVATAR_ACTION_SIT:
                this.updateUserPosture(AvatarAction.POSTURE_SIT);
                break;
            case RoomPreviewer.AVATAR_ACTION_LAY:
                this.updateUserPosture(AvatarAction.POSTURE_LAY);
                break;
            case RoomPreviewer.AVATAR_ACTION_WAVE:
                this.updateUserPosture(AvatarAction.POSTURE_STAND);
                this.updateObjectUserAction(RoomObjectVariable.FIGURE_EXPRESSION, AvatarAction.getExpressionId(AvatarAction.EXPRESSION_WAVE));
                break;
            default:
                this.updateUserPosture(AvatarAction.POSTURE_STAND);
                break;
        }

        this.updateAvatarDirectionAndLocation(this._currentAvatarDirection, this._currentAvatarHeadDirection, this.getAvatarActionLocation());
        this.updatePreviewRoomView(true);
    }

    private rotateAvatar(clockwise: boolean): void
    {
        let step = clockwise ? 1 : -1;
        let nextDirection = this.normalizeAvatarDirection(this._currentAvatarDirection + step);

        if((this._currentAvatarAction === RoomPreviewer.AVATAR_ACTION_SIT) && ((nextDirection % 2) !== 0))
        {
            step *= 2;
            nextDirection = this.normalizeAvatarDirection(this._currentAvatarDirection + step);
        }
        else if((this._currentAvatarAction === RoomPreviewer.AVATAR_ACTION_LAY) && !this.isAvatarActionValidForDirection(this._currentAvatarAction, nextDirection))
        {
            nextDirection = (this._currentAvatarDirection === 0) ? 2 : 0;
        }

        this._currentAvatarDirection = nextDirection;
        this._currentAvatarHeadDirection = nextDirection;
        this.updateAvatarDirectionAndLocation(nextDirection, nextDirection, this.getAvatarActionLocation());
        this.updatePreviewRoomView(true);
    }

    public updateObjectRoom(floorType: string = null, wallType: string = null, landscapeType: string = null, forceUpdate: boolean = false): boolean
    {
        if(this.isRoomEngineReady) return this._roomEngine.updateRoomInstancePlaneType(this._previewRoomId, floorType, wallType, landscapeType, forceUpdate);

        return false;
    }

    public updateRoomWallsAndFloorVisibility(wallsVisible: boolean, floorsVisible: boolean = true): void
    {
        if(this.isRoomEngineReady) this._roomEngine.updateRoomInstancePlaneVisibility(this._previewRoomId, wallsVisible, floorsVisible);
    }

    private getCanvasOffset(point: Point): Point
    {
        if(this._centerWallItems && (this._currentPreviewObjectCategory === RoomObjectCategory.WALL) && ((this._currentPreviewRectangle.width < 1) || (this._currentPreviewRectangle.height < 1)))
        {
            if(this._addViewOffset.x !== point.x) return new Point(this._addViewOffset.x, point.y);

            return null;
        }

        if(((this._currentPreviewRectangle.width < 1) || (this._currentPreviewRectangle.height < 1))) return point;

        let x = (this._centerWallItems && (this._currentPreviewObjectCategory === RoomObjectCategory.WALL))
            ? this._addViewOffset.x
            : (-(this._currentPreviewRectangle.left + this._currentPreviewRectangle.right) >> 1);
        let y = (-(this._currentPreviewRectangle.top + this._currentPreviewRectangle.bottom) >> 1);
        const height = ((this._currentPreviewCanvasHeight - this._currentPreviewRectangle.height) >> 1);

        if(height > 10)
        {
            y = (y + Math.min(15, (height - 10)));
        }
        else
        {
            if(this._currentPreviewObjectCategory !== RoomObjectCategory.UNIT)
            {
                y = (y + (5 - Math.max(0, (height / 2))));
            }
            else
            {
                y = (y - (5 - Math.min(0, (height / 2))));
            }
        }

        y = (y + this._addViewOffset.y);
        if(!this._centerWallItems || (this._currentPreviewObjectCategory !== RoomObjectCategory.WALL)) x = (x + this._addViewOffset.x);

        const offsetX = (x - point.x);
        const offsetY = (y - point.y);

        if((offsetX !== 0) || (offsetY !== 0))
        {
            const distance = Math.sqrt(((offsetX * offsetX) + (offsetY * offsetY)));

            if(distance > 10)
            {
                x = (point.x + ((offsetX * 10) / distance));
                y = (point.y + ((offsetY * 10) / distance));
            }

            return new Point(x, y);
        }

        return null;
    }

    public updatePreviewRoomView(force: boolean = false): void
    {
        if(this._disableUpdate && !force) return;

        this.checkAutomaticRoomObjectStateChange();

        if(this.isRoomEngineReady)
        {
            let offset = this._roomEngine.getRoomInstanceRenderingCanvasOffset(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);

            if(offset)
            {
                this.updatePreviewObjectBoundingRectangle(offset);

                if(this._currentPreviewRectangle)
                {
                    const scale = this._currentPreviewScale;

                    offset = this.validatePreviewSize(offset);

                    const canvasOffset = this.getCanvasOffset(offset);

                    if(canvasOffset)
                    {
                        this._roomEngine.setRoomInstanceRenderingCanvasOffset(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID, canvasOffset);
                    }

                    if(this._currentPreviewScale !== scale) this._currentPreviewRectangle = null;
                }
            }
        }
    }

    private onRoomInitializedonRoomInitialized(event: RoomEngineEvent): void
    {
        if(!event) return;

        switch(event.type)
        {
            case RoomEngineEvent.INITIALIZED:
                if((event.roomId === this._previewRoomId) && this.isRoomEngineReady)
                {
                    this._roomEngine.updateRoomInstancePlaneType(this._previewRoomId, '110', '99999');
                }
                return;
        }
    }

    private onRoomObjectAdded(event: RoomEngineObjectEvent): void
    {
        if((event.roomId === this._previewRoomId) && (event.objectId === RoomPreviewer.PREVIEW_OBJECT_ID) && (event.category === this._currentPreviewObjectCategory))
        {
            this._currentPreviewRectangle = null;
            this._currentPreviewNeedsZoomOut = false;

            const roomObject = this._roomEngine.getRoomObject(event.roomId, event.objectId, event.category);

            if(roomObject) this.applyInvisibleLayerState(roomObject);

            if(roomObject && (event.category === RoomObjectCategory.WALL)) this.updatePreviewWallItemLocation(roomObject);

            this.refreshPreviewCapabilities();
        }
    }

    private applyInvisibleLayerState(roomObject: IRoomObjectController): void
    {
        if(!roomObject?.model) return;

        roomObject.model.setValue(RoomObjectVariable.FURNITURE_INVISIBLE_LAYER, 1);
    }

    private updatePreviewWallItemLocation(roomObject: IRoomObjectController): void
    {
        if(!roomObject) return;

        const mirrored = ((((roomObject.getDirection().x % 360) + 360) % 360) === 180);
        const x = mirrored ? RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.y : RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.x;
        const y = mirrored ? RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.x : RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.y;
        const sizeZ = roomObject.model?.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Z);
        const centerZ = roomObject.model?.getValue<number>(RoomObjectVariable.FURNITURE_CENTER_Z);
        const currentZ = roomObject.getLocation()?.z;
        const z = (Number.isFinite(sizeZ) && Number.isFinite(centerZ))
            ? (((3.6 - sizeZ) / 2) + centerZ)
            : (Number.isFinite(currentZ) ? currentZ : RoomPreviewer.PREVIEW_WALL_ITEM_LOCATION.z);

        this._roomEngine.updateRoomObjectWallLocation(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, new Vector3d(x, y, z));
    }

    public getRenderingCanvas(): IRoomRenderingCanvas
    {
        const renderingCanvas = this._roomEngine.getRoomInstanceRenderingCanvas(this._previewRoomId, RoomPreviewer.PREVIEW_CANVAS_ID);

        if(!renderingCanvas) return null;

        return renderingCanvas;
    }

    public getGenericRoomObjectImage(type: string, value: string, direction: IVector3D, scale: number, listener: IGetImageListener, bgColor: number = 0, extras: string = null, objectData: IObjectData = null, state: number = -1, frame: number = -1, posture: string = null): IImageResult
    {
        if(this.isRoomEngineReady)
        {
            return this._roomEngine.getGenericRoomObjectImage(type, value, direction, scale, listener, bgColor, extras, objectData, state, frame, posture);
        }

        return null;
    }

    public getRoomObjectImage(direction: IVector3D, scale: number, listener: IGetImageListener, bgColor: number = 0): IImageResult
    {
        if(this.isRoomEngineReady)
        {
            return this._roomEngine.getRoomObjectImage(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory, direction, scale, listener, bgColor);
        }

        return null;
    }

    public getRoomObjectCurrentImage(): Texture
    {
        if(this.isRoomEngineReady)
        {
            const roomObject = this._roomEngine.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);

            if(roomObject && roomObject.visualization) return roomObject.visualization.getImage();
        }

        return null;
    }

    public getRoomPreviewObject(): IRoomObjectController
    {
        if(this.isRoomEngineReady)
        {
            const roomObject = this._roomEngine.getRoomObject(this._previewRoomId, RoomPreviewer.PREVIEW_OBJECT_ID, this._currentPreviewObjectCategory);

            if(roomObject) return roomObject;
        }

        return null;
    }

    public getRoomPreviewOwnRoomObject(): IRoomObjectController
    {
        if(this.isRoomEngineReady)
        {
            const roomObject = this._roomEngine.getRoomObject(this._previewRoomId, RoomEngine.ROOM_OBJECT_ID, RoomObjectCategory.ROOM);

            if(roomObject) return roomObject;
        }

        return null;
    }

    public get isRoomEngineReady(): boolean
    {
        return true;
    }

    public get roomId(): number
    {
        return this._previewRoomId;
    }

    public get backgroundColor(): number
    {
        return this._backgroundColor;
    }

    public set backgroundColor(color: number)
    {
        this._backgroundColor = color;
    }

    public get width(): number
    {
        return this._currentPreviewCanvasWidth;
    }

    public get height(): number
    {
        return this._currentPreviewCanvasHeight;
    }
}
