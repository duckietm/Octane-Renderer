import { IFurnitureStackingHeightMap, ILegacyWallGeometry, IObjectData, IRoomCanvasMouseListener, IRoomEngineServices, IRoomGeometry, IRoomObject, IRoomObjectController, IRoomObjectEventManager, ISelectedRoomObjectData, IVector3D, MouseEventType, RoomObjectCategory, RoomObjectOperationType, RoomObjectPlacementSource, RoomObjectType, RoomObjectUserType, RoomObjectVariable } from '@nitrots/api';
import { BotPlaceComposer, ChestOpenComposer, ClickFurniMessageComposer, ClickUserMessageComposer, FurnitureColorWheelComposer, FurnitureDiceActivateComposer, FurnitureDiceDeactivateComposer, FurnitureFloorUpdateComposer, FurnitureGroupInfoComposer, FurnitureMultiStateComposer, FurnitureOneWayDoorComposer, FurniturePickupComposer, FurniturePlaceComposer, FurniturePostItPlaceComposer, FurnitureRandomStateComposer, FurnitureWallMultiStateComposer, FurnitureWallUpdateComposer, GetCommunication, GetItemDataComposer, GetResolutionAchievementsMessageComposer, PetMoveComposer, PetPlaceComposer, RemoveWallItemComposer, RoomUnitLookComposer, RoomUnitWalkComposer, SetItemDataMessageComposer, SetObjectDataMessageComposer } from '@nitrots/communication';
import { GetConfiguration } from '@nitrots/configuration';
import { GetEventDispatcher, RoomEngineDimmerStateEvent, RoomEngineObjectEvent, RoomEngineObjectPlacedEvent, RoomEngineObjectPlacedOnUserEvent, RoomEngineObjectPlaySoundEvent, RoomEngineRoomAdEvent, RoomEngineSamplePlaybackEvent, RoomEngineTriggerWidgetEvent, RoomEngineUseProductEvent, RoomObjectBadgeAssetEvent, RoomObjectDataRequestEvent, RoomObjectDimmerStateUpdateEvent, RoomObjectEvent, RoomObjectFloorHoleEvent, RoomObjectFurnitureActionEvent, RoomObjectHSLColorEnableEvent, RoomObjectHSLColorEnabledEvent, RoomObjectMouseEvent, RoomObjectMoveEvent, RoomObjectPlaySoundIdEvent, RoomObjectRoomAdEvent, RoomObjectSamplePlaybackEvent, RoomObjectSoundMachineEvent, RoomObjectStateChangedEvent, RoomObjectTileMouseEvent, RoomObjectWallMouseEvent, RoomObjectWidgetRequestEvent, RoomSpriteMouseEvent } from '@nitrots/events';
import { GetRoomSessionManager, GetSessionDataManager } from '@nitrots/session';
import { CreateLinkEvent, NitroLogger, RoomId, Vector3d } from '@nitrots/utils';
import { isWiredChestFloorItem } from './utils/isWiredChestFloorItem';
import { RoomEnterEffect, RoomObjectUpdateMessage } from '../../room';
import { ObjectAvatarSelectedMessage, ObjectDataUpdateMessage, ObjectSelectedMessage, ObjectTileCursorUpdateMessage, ObjectVisibilityUpdateMessage } from './messages';
import { SelectedRoomObjectData } from './utils';

export class RoomObjectEventHandler implements IRoomCanvasMouseListener, IRoomObjectEventManager
{
    private static readonly CLICK_USER_LOOK_DELAY_MS = 120;
    private _eventIds: Map<number, Map<string, string>> = new Map();

    private _selectedAvatarId: number = -1;
    private _selectedObjectId: number = -1;
    private _selectedObjectCategory: number = -2;
    private _whereYouClickIsWhereYouGo: boolean = true;
    private _objectPlacementSource: string = null;
    private _pendingAvatarLookTimeout: ReturnType<typeof setTimeout> = null;

    constructor(
        private readonly _roomEngine: IRoomEngineServices)
    {
        GetEventDispatcher().addEventListener<RoomEngineObjectEvent>(RoomEngineObjectEvent.ADDED, event => this.onRoomEngineObjectEvent(event));
    }

    private onRoomEngineObjectEvent(event: RoomEngineObjectEvent): void
    {
        let selectedData = this.getSelectedRoomObjectData(event.roomId);

        if(!selectedData) return;

        if((selectedData.operation === RoomObjectOperationType.OBJECT_PLACE) && (selectedData.id === event.objectId))
        {
            const roomObject = this._roomEngine.getRoomObject(event.roomId, selectedData.id, selectedData.category);

            if(roomObject && roomObject.model)
            {
                if(selectedData.category === RoomObjectCategory.FLOOR)
                {
                    const allowedDirections = roomObject.model.getValue<number[]>(RoomObjectVariable.FURNITURE_ALLOWED_DIRECTIONS);

                    if(allowedDirections && allowedDirections.length)
                    {
                        const direction = new Vector3d(allowedDirections[0]);

                        roomObject.setDirection(direction);

                        this.updateSelectedObjectData(event.roomId, selectedData.id, selectedData.category, selectedData.loc, direction, selectedData.operation, selectedData.typeId, selectedData.instanceData, selectedData.stuffData, selectedData.state, selectedData.animFrame, selectedData.posture);

                        selectedData = this.getSelectedRoomObjectData(event.roomId);

                        if(!selectedData) return;
                    }
                }
            }

            this.setFurnitureAlphaMultiplier(roomObject, 0.5);
        }
    }

    public processRoomCanvasMouseEvent(event: RoomSpriteMouseEvent, object: IRoomObject, geometry: IRoomGeometry): void
    {
        if(!event || !object) return;

        if(RoomEnterEffect.isRunning()) return;

        const type = object.type;

        let category = this._roomEngine.getRoomObjectCategoryForType(type);

        if((category !== RoomObjectCategory.ROOM) && (!this._roomEngine.isPlayingGame() || category !== RoomObjectCategory.UNIT)) category = RoomObjectCategory.MINIMUM;

        const storedEventId = this.getMouseEventId(category, event.type);

        if(storedEventId === event.eventId)
        {
            if((event.type === MouseEventType.MOUSE_CLICK) || (event.type === MouseEventType.DOUBLE_CLICK) || (event.type === MouseEventType.MOUSE_DOWN) || (event.type === MouseEventType.MOUSE_UP) || (event.type === MouseEventType.MOUSE_MOVE)) return;
        }
        else
        {
            if(event.eventId)
            {
                this.setMouseEventId(category, event.type, event.eventId);
            }
        }

        if((event.type === MouseEventType.DOUBLE_CLICK) && (category === RoomObjectCategory.FLOOR) && object.model && (object.model.getValue<number>(RoomObjectVariable.FURNITURE_IS_VARIABLE_HEIGHT) > 0))
        {
            const roomIdString = object.model.getValue<string>(RoomObjectVariable.OBJECT_ROOM_ID);
            const roomId = ((roomIdString && (parseInt(roomIdString.split('_')[0]) || 0)) || -1);

            if((roomId >= 0) && GetEventDispatcher())
            {
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_STACK_HEIGHT, roomId, object.id, category));
                return;
            }
        }

        if(object.mouseHandler) object.mouseHandler.mouseEvent(event, geometry);
    }

    public processRoomObjectPlacement(placementSource: string, roomId: number, id: number, category: number, typeId: number, extra: string = null, stuffData: IObjectData = null, state: number = -1, frameNumber: number = -1, posture: string = null): boolean
    {
        this._objectPlacementSource = placementSource;

        const location = new Vector3d(-100, -100);
        const direction = new Vector3d(0);

        this.setSelectedRoomObjectData(roomId, id, category, location, direction, RoomObjectOperationType.OBJECT_PLACE, typeId, extra, stuffData, state, frameNumber, posture);

        if(this._roomEngine)
        {
            this._roomEngine.setObjectMoverIconSprite(typeId, category, false, extra, stuffData, state, frameNumber, posture);
            this._roomEngine.setObjectMoverIconSpriteVisible(false);
        }

        return true;
    }

    public cancelRoomObjectInsert(roomId: number): boolean
    {
        this.resetSelectedObjectData(roomId);

        return true;
    }

    private getMouseEventId(category: number, eventType: string): string
    {
        const existing = this._eventIds.get(category);

        if(!existing) return null;

        return (existing.get(eventType) || null);
    }

    private setMouseEventId(category: number, eventType: string, eventId: string): void
    {
        let existing = this._eventIds.get(category);

        if(!existing)
        {
            existing = new Map();

            this._eventIds.set(category, existing);
        }

        existing.delete(eventType);
        existing.set(eventType, eventId);
    }


    public handleRoomObjectEvent(event: RoomObjectEvent, roomId: number): void
    {
        if(!event) return;

        if(event instanceof RoomObjectMouseEvent)
        {
            this.handleRoomObjectMouseEvent(event, roomId);

            return;
        }

        switch(event.type)
        {
            case RoomObjectStateChangedEvent.STATE_CHANGE:
            case RoomObjectStateChangedEvent.STATE_RANDOM:
                this.onRoomObjectStateChangedEvent((event as RoomObjectStateChangedEvent), roomId);
                return;
            case RoomObjectDimmerStateUpdateEvent.DIMMER_STATE:
                this.onRoomObjectDimmerStateUpdateEvent((event as RoomObjectDimmerStateUpdateEvent), roomId);
                return;
            case RoomObjectMoveEvent.POSITION_CHANGED:
            case RoomObjectMoveEvent.OBJECT_REMOVED:
                this.handleSelectedObjectRemove((event), roomId);
                return;
            case RoomObjectWidgetRequestEvent.OPEN_WIDGET:
            case RoomObjectWidgetRequestEvent.CLOSE_WIDGET:
            case RoomObjectWidgetRequestEvent.OPEN_FURNI_CONTEXT_MENU:
            case RoomObjectWidgetRequestEvent.CLOSE_FURNI_CONTEXT_MENU:
            case RoomObjectWidgetRequestEvent.PLACEHOLDER:
            case RoomObjectWidgetRequestEvent.CREDITFURNI:
            case RoomObjectWidgetRequestEvent.STACK_HEIGHT:
            case RoomObjectWidgetRequestEvent.EXTERNAL_IMAGE:
            case RoomObjectWidgetRequestEvent.STICKIE:
            case RoomObjectWidgetRequestEvent.PRESENT:
            case RoomObjectWidgetRequestEvent.TROPHY:
            case RoomObjectWidgetRequestEvent.TEASER:
            case RoomObjectWidgetRequestEvent.ECOTRONBOX:
            case RoomObjectWidgetRequestEvent.DIMMER:
            case RoomObjectWidgetRequestEvent.WIDGET_REMOVE_DIMMER:
            case RoomObjectWidgetRequestEvent.CLOTHING_CHANGE:
            case RoomObjectWidgetRequestEvent.JUKEBOX_PLAYLIST_EDITOR:
            case RoomObjectWidgetRequestEvent.MANNEQUIN:
            case RoomObjectWidgetRequestEvent.PET_PRODUCT_MENU:
            case RoomObjectWidgetRequestEvent.GUILD_FURNI_CONTEXT_MENU:
            case RoomObjectWidgetRequestEvent.MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG:
            case RoomObjectWidgetRequestEvent.PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG:
            case RoomObjectWidgetRequestEvent.BACKGROUND_COLOR:
            case RoomObjectWidgetRequestEvent.AREA_HIDE:
            case RoomObjectWidgetRequestEvent.MYSTERYBOX_OPEN_DIALOG:
            case RoomObjectWidgetRequestEvent.EFFECTBOX_OPEN_DIALOG:
            case RoomObjectWidgetRequestEvent.MYSTERYTROPHY_OPEN_DIALOG:
            case RoomObjectWidgetRequestEvent.ACHIEVEMENT_RESOLUTION_OPEN:
            case RoomObjectWidgetRequestEvent.ACHIEVEMENT_RESOLUTION_ENGRAVING:
            case RoomObjectWidgetRequestEvent.ACHIEVEMENT_RESOLUTION_FAILED:
            case RoomObjectWidgetRequestEvent.FRIEND_FURNITURE_CONFIRM:
            case RoomObjectWidgetRequestEvent.FRIEND_FURNITURE_ENGRAVING:
            case RoomObjectWidgetRequestEvent.BADGE_DISPLAY_ENGRAVING:
            case RoomObjectWidgetRequestEvent.HIGH_SCORE_DISPLAY:
            case RoomObjectWidgetRequestEvent.HIDE_HIGH_SCORE_DISPLAY:
            case RoomObjectWidgetRequestEvent.INERNAL_LINK:
            case RoomObjectWidgetRequestEvent.ROOM_LINK:
            case RoomObjectWidgetRequestEvent.YOUTUBE:
                this.onRoomObjectWidgetRequestEvent((event), roomId);
                return;
            case RoomObjectFurnitureActionEvent.DICE_ACTIVATE:
            case RoomObjectFurnitureActionEvent.DICE_OFF:
            case RoomObjectFurnitureActionEvent.USE_HABBOWHEEL:
            case RoomObjectFurnitureActionEvent.STICKIE:
            case RoomObjectFurnitureActionEvent.ENTER_ONEWAYDOOR:
                this.onRoomObjectFurnitureActionEvent((event), roomId);
                return;
            case RoomObjectFurnitureActionEvent.SOUND_MACHINE_INIT:
            case RoomObjectFurnitureActionEvent.SOUND_MACHINE_START:
            case RoomObjectFurnitureActionEvent.SOUND_MACHINE_STOP:
            case RoomObjectFurnitureActionEvent.SOUND_MACHINE_DISPOSE:
                this.handleObjectSoundMachineEvent(event, roomId);
                return;
            case RoomObjectFurnitureActionEvent.JUKEBOX_INIT:
            case RoomObjectFurnitureActionEvent.JUKEBOX_START:
            case RoomObjectFurnitureActionEvent.JUKEBOX_MACHINE_STOP:
            case RoomObjectFurnitureActionEvent.JUKEBOX_DISPOSE:
                this.handleObjectJukeboxEvent(event, roomId);
                return;
            case RoomObjectFloorHoleEvent.ADD_HOLE:
            case RoomObjectFloorHoleEvent.REMOVE_HOLE:
                this.onRoomObjectFloorHoleEvent((event), roomId);
                return;
            case RoomObjectRoomAdEvent.ROOM_AD_FURNI_CLICK:
            case RoomObjectRoomAdEvent.ROOM_AD_FURNI_DOUBLE_CLICK:
            case RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_SHOW:
            case RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_HIDE:
            case RoomObjectRoomAdEvent.ROOM_AD_LOAD_IMAGE:
                this.onRoomObjectRoomAdEvent((event as RoomObjectRoomAdEvent), roomId);
                return;
            case RoomObjectBadgeAssetEvent.LOAD_BADGE:
                this.onRoomObjectBadgeAssetEvent((event as RoomObjectBadgeAssetEvent), roomId);
                return;
            case RoomObjectFurnitureActionEvent.MOUSE_ARROW:
            case RoomObjectFurnitureActionEvent.MOUSE_BUTTON:
                this.handleMousePointer((event), roomId);
                return;
            case RoomObjectPlaySoundIdEvent.PLAY_SOUND:
            case RoomObjectPlaySoundIdEvent.PLAY_SOUND_AT_PITCH:
                this.handleRoomObjectPlaySoundEvent((event as RoomObjectPlaySoundIdEvent), roomId);
                return;
            case RoomObjectSamplePlaybackEvent.ROOM_OBJECT_INITIALIZED:
            case RoomObjectSamplePlaybackEvent.ROOM_OBJECT_DISPOSED:
            case RoomObjectSamplePlaybackEvent.PLAY_SAMPLE:
            case RoomObjectSamplePlaybackEvent.CHANGE_PITCH:
                this.handleRoomObjectSamplePlaybackEvent((event as RoomObjectSamplePlaybackEvent), roomId);
                return;
            case RoomObjectHSLColorEnableEvent.ROOM_BACKGROUND_COLOR:
                this.onHSLColorEnableEvent((event as RoomObjectHSLColorEnableEvent), roomId);
                return;
            case RoomObjectDataRequestEvent.RODRE_CURRENT_USER_ID:
            case RoomObjectDataRequestEvent.RODRE_URL_PREFIX:
                this.onRoomObjectDataRequestEvent((event), roomId);
                return;
            default:
                NitroLogger.warn('Unhandled Event', event.constructor.name, 'Object ID', event.object.id);
                return;
        }
    }

    private handleRoomObjectMouseEvent(event: RoomObjectMouseEvent, roomId: number): void
    {
        if(!event || !event.type) return;

        if(event instanceof RoomObjectTileMouseEvent)
        {
            this._roomEngine.areaSelectionManager.handleTileMouseEvent(event);
        }

        switch(event.type)
        {
            case RoomObjectMouseEvent.CLICK:
                this.handleRoomObjectMouseClickEvent(event, roomId);
                return;
            case RoomObjectMouseEvent.DOUBLE_CLICK:
                this.handleRoomObjectMouseDoubleClickEvent(event, roomId);
                return;
            case RoomObjectMouseEvent.MOUSE_MOVE:
                this.handleRoomObjectMouseMoveEvent(event, roomId);
                return;
            case RoomObjectMouseEvent.MOUSE_DOWN:
                this.handleRoomObjectMouseDownEvent(event, roomId);
                return;
            case RoomObjectMouseEvent.MOUSE_DOWN_LONG:
                this.handleRoomObjectMouseDownLongEvent(event, roomId);
                return;
            case RoomObjectMouseEvent.MOUSE_ENTER:
                this.handleRoomObjectMouseEnterEvent(event, roomId);
                return;
            case RoomObjectMouseEvent.MOUSE_LEAVE:
                this.handleRoomObjectMouseLeaveEvent(event, roomId);
                return;
        }
    }

    private clickRoomObject(event: RoomObjectMouseEvent, operation: string): void
    {
        if(!event || event.altKey || event.ctrlKey || event.shiftKey) return;

        const objectId = event.objectId;
        const objectType = event.objectType;
        const category = this._roomEngine.getRoomObjectCategoryForType(objectType);

        if(category === RoomObjectCategory.FLOOR)
        {
            GetCommunication().connection.send(new ClickFurniMessageComposer(objectId, category));

            return;
        }

        if(category === RoomObjectCategory.WALL)
        {
            // This packet only sends a negative number to tell the server that its a wall item
            GetCommunication().connection.send(new ClickFurniMessageComposer(-Math.abs(objectId), category));

            return;
        }

        if((category === RoomObjectCategory.UNIT) && (operation === RoomObjectOperationType.OBJECT_UNDEFINED) && (objectType === RoomObjectUserType.USER))
        {
            GetCommunication().connection.send(new ClickUserMessageComposer(objectId));
        }
    }

    private handleRoomObjectMouseClickEvent(event: RoomObjectMouseEvent, roomId: number): void
    {
        if(!event) return;

        let operation = RoomObjectOperationType.OBJECT_UNDEFINED;

        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(selectedData) operation = selectedData.operation;

        this.clickRoomObject(event, operation);

        let didWalk = false;
        let didMove = false;

        if(this.whereYouClickIsWhereYouGo())
        {
            if(!operation || (operation === RoomObjectOperationType.OBJECT_UNDEFINED))
            {
                didWalk = this.handleMoveTargetFurni(roomId, event);
            }
        }

        const category = this._roomEngine.getRoomObjectCategoryForType(event.objectType);

        switch(operation)
        {
            case RoomObjectOperationType.OBJECT_MOVE:
                if(category === RoomObjectCategory.ROOM)
                {
                    if(selectedData)
                    {
                        this.modifyRoomObject(roomId, selectedData.id, selectedData.category, RoomObjectOperationType.OBJECT_MOVE_TO);
                    }
                }

                else if(category === RoomObjectCategory.UNIT)
                {
                    if(selectedData && (event.objectType === RoomObjectUserType.MONSTER_PLANT))
                    {
                        this.modifyRoomObject(roomId, selectedData.id, selectedData.category, RoomObjectOperationType.OBJECT_MOVE_TO);
                    }

                    if(event.eventId) this.setMouseEventId(RoomObjectCategory.ROOM, MouseEventType.MOUSE_CLICK, event.eventId);

                    this.placeObjectOnUser(roomId, event.objectId, category);
                }

                didMove = true;

                if(event.objectId !== -1) this.setSelectedObject(roomId, event.objectId, category);

                break;
            case RoomObjectOperationType.OBJECT_PLACE:
                if(category === RoomObjectCategory.ROOM)
                {
                    this.handleObjectPlace(event, roomId);
                    this.placeObject(roomId, (event instanceof RoomObjectTileMouseEvent), (event instanceof RoomObjectWallMouseEvent));
                }

                else if(category === RoomObjectCategory.UNIT)
                {
                    switch(event.objectType)
                    {
                        case RoomObjectUserType.MONSTER_PLANT:
                        case RoomObjectUserType.RENTABLE_BOT:
                            this.handleObjectPlace(event, roomId);
                            this.placeObject(roomId, (event instanceof RoomObjectTileMouseEvent), (event instanceof RoomObjectWallMouseEvent));
                            break;
                        default:
                            if(event.eventId)
                            {
                                this.setMouseEventId(RoomObjectCategory.ROOM, MouseEventType.MOUSE_CLICK, event.eventId);
                            }

                            this.placeObjectOnUser(roomId, event.objectId, category);
                            break;
                    }
                }
                break;
            case RoomObjectOperationType.OBJECT_UNDEFINED:
                if(category === RoomObjectCategory.ROOM)
                {
                    if(!didWalk && (event instanceof RoomObjectTileMouseEvent)) this.handleClickOnTile(roomId, event);
                }
                else
                {
                    if(!this._roomEngine.isAreaSelectionMode() || (category === RoomObjectCategory.UNIT))
                    {
                        this.setSelectedObject(roomId, event.objectId, category);
                    }
                    else
                    {
                        this.deselectObject(roomId);

                        GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.DESELECTED, roomId, -1, RoomObjectCategory.MINIMUM));
                    }

                    didMove = false;

                    if(category === RoomObjectCategory.UNIT)
                    {
                        if(event.ctrlKey && !event.altKey && !event.shiftKey && (event.objectType === RoomObjectUserType.RENTABLE_BOT))
                        {
                            this.modifyRoomObject(roomId, event.objectId, category, RoomObjectOperationType.OBJECT_PICKUP_BOT);
                        }

                        else if(event.ctrlKey && !event.altKey && !event.shiftKey && (event.objectType === RoomObjectUserType.MONSTER_PLANT))
                        {
                            this.modifyRoomObject(roomId, event.objectId, category, RoomObjectOperationType.OBJECT_PICKUP_PET);
                        }

                        else if(!event.ctrlKey && !event.altKey && event.shiftKey && (event.objectType === RoomObjectUserType.MONSTER_PLANT))
                        {
                            this.modifyRoomObject(roomId, event.objectId, category, RoomObjectOperationType.OBJECT_ROTATE_POSITIVE);
                        }

                        if(!this._roomEngine.isPlayingGame())
                        {
                            didWalk = true;
                        }
                        else
                        {
                            didMove = true;
                        }
                    }

                    else if((category === RoomObjectCategory.FLOOR) || (category === RoomObjectCategory.WALL))
                    {
                        if(event.altKey || event.ctrlKey || event.shiftKey)
                        {
                            if(!event.ctrlKey && !event.altKey && event.shiftKey)
                            {
                                if(category === RoomObjectCategory.FLOOR)
                                {
                                    if(GetEventDispatcher())
                                    {
                                        GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.REQUEST_ROTATE, roomId, event.objectId, category));
                                    }
                                }
                            }

                            else if(event.ctrlKey && !event.altKey && !event.shiftKey)
                            {
                                this.modifyRoomObject(roomId, event.objectId, category, RoomObjectOperationType.OBJECT_PICKUP);
                            }

                            if(!this._roomEngine.isPlayingGame())
                            {
                                didWalk = true;
                            }
                            else
                            {
                                didMove = true;
                            }
                        }
                    }

                    if(event.eventId)
                    {
                        if(didWalk)
                        {
                            this.setMouseEventId(RoomObjectCategory.ROOM, MouseEventType.MOUSE_CLICK, event.eventId);
                        }

                        if(didMove)
                        {
                            this.setMouseEventId(RoomObjectCategory.MINIMUM, MouseEventType.MOUSE_CLICK, event.eventId);
                        }
                    }
                }
                break;
        }

        if(category === RoomObjectCategory.ROOM)
        {
            const minimumClickEventId = this.getMouseEventId(RoomObjectCategory.MINIMUM, MouseEventType.MOUSE_CLICK);
            const unitClickEventId = this.getMouseEventId(RoomObjectCategory.UNIT, MouseEventType.MOUSE_CLICK);

            if((minimumClickEventId !== event.eventId) && (unitClickEventId !== event.eventId) && !didMove)
            {
                this.deselectObject(roomId);

                if(GetEventDispatcher()) GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.DESELECTED, roomId, -1, RoomObjectCategory.MINIMUM));

                this.setSelectedAvatar(roomId, 0, false);
            }
        }
    }

    private handleRoomObjectMouseDoubleClickEvent(event: RoomObjectMouseEvent, roomId: number): void
    {
        const id = event.objectId;
        const type = event.objectType;
        const category = this._roomEngine.getRoomObjectCategoryForType(type);

        if(GetEventDispatcher())
        {
            GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.DOUBLE_CLICK, roomId, id, category));
        }
    }

    private handleRoomObjectMouseMoveEvent(event: RoomObjectMouseEvent, roomId: number): void
    {
        if(!event) return;

        let operation = RoomObjectOperationType.OBJECT_UNDEFINED;

        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(selectedData) operation = selectedData.operation;

        const category = this._roomEngine.getRoomObjectCategoryForType(event.objectType);

        if(this._roomEngine)
        {
            const roomCursor = this._roomEngine.getRoomObjectCursor(roomId);

            if(roomCursor && roomCursor.logic)
            {
                let newEvent: ObjectTileCursorUpdateMessage = null;

                if(event instanceof RoomObjectTileMouseEvent)
                {
                    newEvent = this.handleMouseOverTile(event, roomId);
                }

                else if(event.object && (event.object.id !== -1))
                {
                    if(this.whereYouClickIsWhereYouGo())
                    {
                        newEvent = this.handleMouseOverObject(category, roomId, event);
                    }
                }

                else
                {
                    newEvent = new ObjectTileCursorUpdateMessage(null, 0, false, event.eventId);
                }

                roomCursor.processUpdateMessage(newEvent);
            }
        }

        switch(operation)
        {
            case RoomObjectOperationType.OBJECT_MOVE:
                if(category === RoomObjectCategory.ROOM) this.handleObjectMove(event, roomId);

                return;
            case RoomObjectOperationType.OBJECT_PLACE:
                if(category === RoomObjectCategory.ROOM) this.handleObjectPlace(event, roomId);

                return;
        }
    }

    private handleRoomObjectMouseDownEvent(event: RoomObjectMouseEvent, roomId: number): void
    {
        if(!event) return;

        let operation = RoomObjectOperationType.OBJECT_UNDEFINED;

        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(selectedData) operation = selectedData.operation;

        const category = this._roomEngine.getRoomObjectCategoryForType(event.objectType);

        switch(operation)
        {
            case RoomObjectOperationType.OBJECT_UNDEFINED:
                if((category === RoomObjectCategory.FLOOR) || (category === RoomObjectCategory.WALL) || (event.objectType === RoomObjectUserType.MONSTER_PLANT))
                {
                    if((event.altKey && !event.ctrlKey && !event.shiftKey) || this.decorateModeMove(event))
                    {
                        if(GetEventDispatcher()) GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.REQUEST_MOVE, roomId, event.objectId, category));
                    }
                }
                return;
        }
    }

    private handleRoomObjectMouseDownLongEvent(event: RoomObjectMouseEvent, roomId: number): void
    {
        if(!event) return;

        let operation = RoomObjectOperationType.OBJECT_UNDEFINED;

        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(selectedData) operation = selectedData.operation;

        const category = this._roomEngine.getRoomObjectCategoryForType(event.objectType);

        switch(operation)
        {
            case RoomObjectOperationType.OBJECT_UNDEFINED:
                if((category === RoomObjectCategory.FLOOR) || (category === RoomObjectCategory.WALL) || (event.objectType === RoomObjectUserType.MONSTER_PLANT))
                {
                    if((!event.ctrlKey && !event.shiftKey) || this.decorateModeMove(event))
                    {
                        if(GetEventDispatcher()) GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.REQUEST_MANIPULATION, roomId, event.objectId, category));
                    }
                }
                return;
        }
    }

    private handleRoomObjectMouseEnterEvent(event: RoomObjectMouseEvent, roomId: number): void
    {
        const id = event.objectId;
        const type = event.objectType;
        const category = this._roomEngine.getRoomObjectCategoryForType(type);

        if(GetEventDispatcher())
        {
            GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.MOUSE_ENTER, roomId, id, category));
        }
    }

    private handleRoomObjectMouseLeaveEvent(event: RoomObjectMouseEvent, roomId: number): void
    {
        const id = event.objectId;
        const type = event.objectType;
        const category = this._roomEngine.getRoomObjectCategoryForType(type);

        if(category !== RoomObjectCategory.ROOM)
        {
            if(category === RoomObjectCategory.UNIT)
            {
                const cursor = this._roomEngine.getRoomObjectCursor(roomId);

                if(cursor) cursor.processUpdateMessage(new ObjectDataUpdateMessage(0, null));
            }
        }

        if(GetEventDispatcher())
        {
            GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.MOUSE_LEAVE, roomId, id, category));
        }

        return;
    }

    private onRoomObjectStateChangedEvent(event: RoomObjectStateChangedEvent, roomId: number): void
    {
        if(!event) return;

        switch(event.type)
        {
            case RoomObjectStateChangedEvent.STATE_CHANGE:
                this.changeObjectState(roomId, event.object.id, event.object.type, event.state, false);
                return;
            case RoomObjectStateChangedEvent.STATE_RANDOM:
                this.changeObjectState(roomId, event.object.id, event.object.type, event.state, true);
                return;
        }
    }

    private onRoomObjectDimmerStateUpdateEvent(event: RoomObjectDimmerStateUpdateEvent, roomId: number): void
    {
        if(!event) return;

        switch(event.type)
        {
            case RoomObjectDimmerStateUpdateEvent.DIMMER_STATE:
                GetEventDispatcher().dispatchEvent(new RoomEngineDimmerStateEvent(roomId, event.state, event.presetId, event.effectId, event.color, event.brightness));
                return;
        }
    }

    private handleSelectedObjectRemove(event: RoomObjectMoveEvent, roomId: number): void
    {
        if(!event || !this._roomEngine) return;

        switch(event.type)
        {
            case RoomObjectMoveEvent.POSITION_CHANGED: {
                const objectId = event.objectId;
                const objectType = event.objectType;
                const objectCategory = this._roomEngine.getRoomObjectCategoryForType(objectType);
                const object = this._roomEngine.getRoomObject(roomId, objectId, objectCategory);
                const selectionArrow = this._roomEngine.getRoomObjectSelectionArrow(roomId);

                if(object && selectionArrow && selectionArrow.logic)
                {
                    const location = object.getLocation();

                    selectionArrow.logic.processUpdateMessage(new RoomObjectUpdateMessage(location, null));
                }
                return;
            }
            case RoomObjectMoveEvent.OBJECT_REMOVED:
                this.setSelectedAvatar(roomId, 0, false);
                return;
        }
    }

    private onRoomObjectWidgetRequestEvent(event: RoomObjectWidgetRequestEvent, roomId: number): void
    {
        if(!event || !this._roomEngine) return;

        const objectId = event.objectId;
        const objectType = event.objectType;
        const objectCategory = this._roomEngine.getRoomObjectCategoryForType(objectType);

        if(RoomId.isRoomPreviewerId(roomId)) return;

        switch(event.type)
        {
            case RoomObjectWidgetRequestEvent.OPEN_WIDGET:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.OPEN_WIDGET, roomId, objectId, objectCategory, ((event.object as IRoomObjectController).logic.widget)));
                return;
            case RoomObjectWidgetRequestEvent.CLOSE_WIDGET:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.CLOSE_WIDGET, roomId, objectId, objectCategory, ((event.object as IRoomObjectController).logic.widget)));
                return;
            case RoomObjectWidgetRequestEvent.OPEN_FURNI_CONTEXT_MENU:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.OPEN_FURNI_CONTEXT_MENU, roomId, objectId, objectCategory, ((event.object as IRoomObjectController).logic.contextMenu)));
                return;
            case RoomObjectWidgetRequestEvent.CLOSE_FURNI_CONTEXT_MENU:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.CLOSE_FURNI_CONTEXT_MENU, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.PLACEHOLDER:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_PLACEHOLDER, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.CREDITFURNI:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_CREDITFURNI, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.STACK_HEIGHT:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_STACK_HEIGHT, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.EXTERNAL_IMAGE:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_EXTERNAL_IMAGE, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.STICKIE:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_STICKIE, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.PRESENT:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_PRESENT, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.TROPHY:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_TROPHY, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.TEASER:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_TEASER, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.ECOTRONBOX:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_ECOTRONBOX, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.DIMMER:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_DIMMER, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.WIDGET_REMOVE_DIMMER:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REMOVE_DIMMER, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.CLOTHING_CHANGE:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_CLOTHING_CHANGE, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.JUKEBOX_PLAYLIST_EDITOR:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_PLAYLIST_EDITOR, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.MANNEQUIN:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_MANNEQUIN, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.PET_PRODUCT_MENU:
                GetEventDispatcher().dispatchEvent(new RoomEngineUseProductEvent(RoomEngineUseProductEvent.USE_PRODUCT_FROM_ROOM, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.GUILD_FURNI_CONTEXT_MENU:
                GetCommunication().connection.send(new FurnitureGroupInfoComposer(event.objectId, event.object.model.getValue<number>(RoomObjectVariable.FURNITURE_GUILD_CUSTOMIZED_GUILD_ID)));
                return;
            case RoomObjectWidgetRequestEvent.MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_MONSTERPLANT_SEED_PLANT_CONFIRMATION_DIALOG, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_PURCHASABLE_CLOTHING_CONFIRMATION_DIALOG, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.BACKGROUND_COLOR:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_BACKGROUND_COLOR, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.AREA_HIDE:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_AREA_HIDE, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.MYSTERYBOX_OPEN_DIALOG:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_MYSTERYBOX_OPEN_DIALOG, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.EFFECTBOX_OPEN_DIALOG:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_EFFECTBOX_OPEN_DIALOG, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.MYSTERYTROPHY_OPEN_DIALOG:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_MYSTERYTROPHY_OPEN_DIALOG, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.ACHIEVEMENT_RESOLUTION_OPEN:
                GetCommunication().connection.send(new GetResolutionAchievementsMessageComposer(event.objectId, 0));
                return;
            case RoomObjectWidgetRequestEvent.ACHIEVEMENT_RESOLUTION_ENGRAVING:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_ACHIEVEMENT_RESOLUTION_ENGRAVING, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.ACHIEVEMENT_RESOLUTION_FAILED:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_ACHIEVEMENT_RESOLUTION_FAILED, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.FRIEND_FURNITURE_CONFIRM:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_FRIEND_FURNITURE_CONFIRM, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.FRIEND_FURNITURE_ENGRAVING:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_FRIEND_FURNITURE_ENGRAVING, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.BADGE_DISPLAY_ENGRAVING:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_BADGE_DISPLAY_ENGRAVING, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.HIGH_SCORE_DISPLAY:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_HIGH_SCORE_DISPLAY, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.HIDE_HIGH_SCORE_DISPLAY:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_HIDE_HIGH_SCORE_DISPLAY, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.INERNAL_LINK:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_INTERNAL_LINK, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.ROOM_LINK:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_ROOM_LINK, roomId, objectId, objectCategory));
                return;
            case RoomObjectWidgetRequestEvent.YOUTUBE:
                GetEventDispatcher().dispatchEvent(new RoomEngineTriggerWidgetEvent(RoomEngineTriggerWidgetEvent.REQUEST_YOUTUBE, roomId, objectId, objectCategory));
                return;
        }
    }

    private onRoomObjectFurnitureActionEvent(event: RoomObjectFurnitureActionEvent, roomId: number): void
    {
        if(!event) return;

        this.useObject(roomId, event.object.id, event.object.type, event.type);
    }

    private handleObjectSoundMachineEvent(event: RoomObjectEvent, roomId: number): void
    {
        if(!event) return;

        const objectCategory = this._roomEngine.getRoomObjectCategoryForType(event.objectType);
        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(selectedData)
        {
            if((selectedData.category === objectCategory) && (selectedData.id === event.objectId))
            {
                if(selectedData.operation === RoomObjectOperationType.OBJECT_PLACE) return;
            }
        }

        switch(event.type)
        {
            case RoomObjectFurnitureActionEvent.SOUND_MACHINE_INIT:
                GetEventDispatcher().dispatchEvent(new RoomObjectSoundMachineEvent(RoomObjectSoundMachineEvent.SOUND_MACHINE_INIT, roomId, event.objectId, objectCategory));
                return;
            case RoomObjectFurnitureActionEvent.SOUND_MACHINE_START:
                GetEventDispatcher().dispatchEvent(new RoomObjectSoundMachineEvent(RoomObjectSoundMachineEvent.SOUND_MACHINE_SWITCHED_ON, roomId, event.objectId, objectCategory));
                return;
            case RoomObjectFurnitureActionEvent.SOUND_MACHINE_STOP:
                GetEventDispatcher().dispatchEvent(new RoomObjectSoundMachineEvent(RoomObjectSoundMachineEvent.SOUND_MACHINE_SWITCHED_OFF, roomId, event.objectId, objectCategory));
                return;
            case RoomObjectFurnitureActionEvent.SOUND_MACHINE_DISPOSE:
                GetEventDispatcher().dispatchEvent(new RoomObjectSoundMachineEvent(RoomObjectSoundMachineEvent.SOUND_MACHINE_DISPOSE, roomId, event.objectId, objectCategory));
                return;
        }
    }

    private handleObjectJukeboxEvent(event: RoomObjectEvent, roomId: number): void
    {
        if(!event) return;

        const objectCategory = this._roomEngine.getRoomObjectCategoryForType(event.objectType);
        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(selectedData)
        {
            if((selectedData.category === objectCategory) && (selectedData.id === event.objectId))
            {
                if(selectedData.operation === RoomObjectOperationType.OBJECT_PLACE) return;
            }
        }

        switch(event.type)
        {
            case RoomObjectFurnitureActionEvent.JUKEBOX_INIT:
                GetEventDispatcher().dispatchEvent(new RoomObjectSoundMachineEvent(RoomObjectSoundMachineEvent.JUKEBOX_INIT, roomId, event.objectId, objectCategory));
                return;
            case RoomObjectFurnitureActionEvent.JUKEBOX_START:
                GetEventDispatcher().dispatchEvent(new RoomObjectSoundMachineEvent(RoomObjectSoundMachineEvent.JUKEBOX_SWITCHED_ON, roomId, event.objectId, objectCategory));
                return;
            case RoomObjectFurnitureActionEvent.JUKEBOX_MACHINE_STOP:
                GetEventDispatcher().dispatchEvent(new RoomObjectSoundMachineEvent(RoomObjectSoundMachineEvent.JUKEBOX_SWITCHED_OFF, roomId, event.objectId, objectCategory));
                return;
            case RoomObjectFurnitureActionEvent.JUKEBOX_DISPOSE:
                GetEventDispatcher().dispatchEvent(new RoomObjectSoundMachineEvent(RoomObjectSoundMachineEvent.JUKEBOX_DISPOSE, roomId, event.objectId, objectCategory));
                return;
        }
    }

    private onRoomObjectFloorHoleEvent(event: RoomObjectFloorHoleEvent, roomId: number): void
    {
        if(!event) return;

        switch(event.type)
        {
            case RoomObjectFloorHoleEvent.ADD_HOLE:
                this._roomEngine.addRoomInstanceFloorHole(roomId, event.objectId);
                return;
            case RoomObjectFloorHoleEvent.REMOVE_HOLE:
                this._roomEngine.removeRoomInstanceFloorHole(roomId, event.objectId);
                return;
        }
    }

    private onRoomObjectRoomAdEvent(event: RoomObjectRoomAdEvent, roomId: number): void
    {
        if(!event) return;

        let eventType: string = null;

        switch(event.type)
        {
            case RoomObjectRoomAdEvent.ROOM_AD_FURNI_CLICK:
                GetEventDispatcher().dispatchEvent(event);

                if(event.clickUrl && (event.clickUrl.length > 0))
                {
                    CreateLinkEvent(event.clickUrl);
                }

                eventType = RoomEngineRoomAdEvent.FURNI_CLICK;
                break;
            case RoomObjectRoomAdEvent.ROOM_AD_FURNI_DOUBLE_CLICK:
                if(event.clickUrl && (event.clickUrl.length > 0))
                {
                    const catalogPage = 'CATALOG_PAGE';

                    if(event.clickUrl.indexOf(catalogPage) === 0) CreateLinkEvent(event.clickUrl.substr(catalogPage.length));
                }

                eventType = RoomEngineRoomAdEvent.FURNI_DOUBLE_CLICK;
                break;
            case RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_SHOW:
                eventType = RoomEngineRoomAdEvent.TOOLTIP_SHOW;
                break;
            case RoomObjectRoomAdEvent.ROOM_AD_TOOLTIP_HIDE:
                eventType = RoomEngineRoomAdEvent.TOOLTIP_HIDE;
                break;
        }

        if(eventType) GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(eventType, roomId, event.objectId, this._roomEngine.getRoomObjectCategoryForType(event.objectType)));
    }

    private onRoomObjectBadgeAssetEvent(event: RoomObjectBadgeAssetEvent, roomId: number): void
    {
        if(!event || !this._roomEngine) return;

        switch(event.type)
        {
            case RoomObjectBadgeAssetEvent.LOAD_BADGE: {
                const objectId = event.objectId;
                const objectType = event.objectType;
                const objectCategory = this._roomEngine.getRoomObjectCategoryForType(objectType);

                this._roomEngine.loadRoomObjectBadgeImage(roomId, objectId, objectCategory, event.badgeId, event.groupBadge);
                return;
            }
        }
    }

    private handleMousePointer(event: RoomObjectFurnitureActionEvent, roomId: number): void
    {
        if(!event) return;

        this._roomEngine.updateMousePointer(event.type, event.objectId, event.objectType);
    }

    private handleRoomObjectPlaySoundEvent(event: RoomObjectPlaySoundIdEvent, roomId: number): void
    {
        const objectCategory = this._roomEngine.getRoomObjectCategoryForType(event.objectType);

        switch(event.type)
        {
            case RoomObjectPlaySoundIdEvent.PLAY_SOUND:
                GetEventDispatcher().dispatchEvent(new RoomEngineObjectPlaySoundEvent(RoomEngineObjectPlaySoundEvent.PLAY_SOUND, roomId, event.objectId, objectCategory, event.soundId, event.pitch));
                return;
            case RoomObjectPlaySoundIdEvent.PLAY_SOUND_AT_PITCH:
                GetEventDispatcher().dispatchEvent(new RoomEngineObjectPlaySoundEvent(RoomEngineObjectPlaySoundEvent.PLAY_SOUND_AT_PITCH, roomId, event.objectId, objectCategory, event.soundId, event.pitch));
                return;
        }
    }

    private handleRoomObjectSamplePlaybackEvent(event: RoomObjectSamplePlaybackEvent, roomId: number): void
    {
        if(!event) return;

        const objectCategory = this._roomEngine.getRoomObjectCategoryForType(event.objectType);

        switch(event.type)
        {
            case RoomObjectSamplePlaybackEvent.ROOM_OBJECT_INITIALIZED:
                GetEventDispatcher().dispatchEvent(new RoomEngineSamplePlaybackEvent(RoomEngineSamplePlaybackEvent.ROOM_OBJECT_INITIALIZED, roomId, event.objectId, objectCategory, event.sampleId, event.pitch));
                break;
            case RoomObjectSamplePlaybackEvent.ROOM_OBJECT_DISPOSED:
                GetEventDispatcher().dispatchEvent(new RoomEngineSamplePlaybackEvent(RoomEngineSamplePlaybackEvent.ROOM_OBJECT_DISPOSED, roomId, event.objectId, objectCategory, event.sampleId, event.pitch));
                break;
            case RoomObjectSamplePlaybackEvent.PLAY_SAMPLE:
                GetEventDispatcher().dispatchEvent(new RoomEngineSamplePlaybackEvent(RoomEngineSamplePlaybackEvent.PLAY_SAMPLE, roomId, event.objectId, objectCategory, event.sampleId, event.pitch));
                break;
            case RoomObjectSamplePlaybackEvent.CHANGE_PITCH:
                GetEventDispatcher().dispatchEvent(new RoomEngineSamplePlaybackEvent(RoomEngineSamplePlaybackEvent.CHANGE_PITCH, roomId, event.objectId, objectCategory, event.sampleId, event.pitch));
                break;
        }
    }

    private onHSLColorEnableEvent(event: RoomObjectHSLColorEnableEvent, roomId: number): void
    {
        if(!event || !this._roomEngine) return;

        switch(event.type)
        {
            case RoomObjectHSLColorEnableEvent.ROOM_BACKGROUND_COLOR:
                GetEventDispatcher().dispatchEvent(new RoomObjectHSLColorEnabledEvent(RoomObjectHSLColorEnabledEvent.ROOM_BACKGROUND_COLOR, roomId, event.enable, event.hue, event.saturation, event.lightness));
                return;
        }
    }

    private onRoomObjectDataRequestEvent(event: RoomObjectDataRequestEvent, roomId: number): void
    {
        if(!event || !this._roomEngine || !event.object) return;

        switch(event.type)
        {
            case RoomObjectDataRequestEvent.RODRE_CURRENT_USER_ID:
                event.object.model.setValue(RoomObjectVariable.SESSION_CURRENT_USER_ID, GetSessionDataManager().userId);
                return;
            case RoomObjectDataRequestEvent.RODRE_URL_PREFIX:
                event.object.model.setValue(RoomObjectVariable.SESSION_URL_PREFIX, GetConfiguration().getValue('url.prefix'));
                return;
        }
    }

    private handleClickOnTile(roomId: number, event: RoomObjectTileMouseEvent): void
    {
        if(!this._roomEngine || this._roomEngine.isDecorating) return;

        const session = GetRoomSessionManager().getSession(roomId);

        if(!session || session.isSpectator) return;

        if(!this._roomEngine.moveBlocked) this.sendWalkUpdate(event.tileXAsInt, event.tileYAsInt);
    }

    private handleObjectMove(event: RoomObjectMouseEvent, roomId: number): void
    {
        if(!event || !this._roomEngine) return;

        const eventDispatcher = GetEventDispatcher();

        if(!eventDispatcher) return;

        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(!selectedData) return;

        const roomObject = this._roomEngine.getRoomObject(roomId, selectedData.id, selectedData.category);

        if(!roomObject) return;

        let moveValid = true;

        if((selectedData.category === RoomObjectCategory.FLOOR) || (selectedData.category === RoomObjectCategory.UNIT))
        {
            const stackingHeightMap = this._roomEngine.getFurnitureStackingHeightMap(roomId);

            if(!(((event instanceof RoomObjectTileMouseEvent)) && (this.handleFurnitureMove(roomObject, selectedData, Math.trunc(event.tileX + 0.5), Math.trunc(event.tileY + 0.5), stackingHeightMap))))
            {
                this.handleFurnitureMove(roomObject, selectedData, selectedData.loc.x, selectedData.loc.y, stackingHeightMap);

                moveValid = false;
            }
        }

        else if((selectedData.category === RoomObjectCategory.WALL))
        {
            moveValid = false;

            if(event instanceof RoomObjectWallMouseEvent)
            {
                const wallLocation = event.wallLocation;
                const wallWidth = event.wallWidth;
                const wallHeight = event.wallHeight;
                const x = event.x;
                const y = event.y;
                const direction = event.direction;

                if(this.handleWallItemMove(roomObject, selectedData, wallLocation, wallWidth, wallHeight, x, y, direction))
                {
                    moveValid = true;
                }
            }

            if(!moveValid)
            {
                roomObject.setLocation(selectedData.loc);
                roomObject.setDirection(selectedData.dir);
            }

            this._roomEngine.updateRoomObjectMask(roomId, selectedData.id, moveValid);
        }

        if(moveValid)
        {
            this.setFurnitureAlphaMultiplier(roomObject, 0.5);

            this._roomEngine.setObjectMoverIconSpriteVisible(false);
        }
        else
        {
            this.setFurnitureAlphaMultiplier(roomObject, 0);

            this._roomEngine.setObjectMoverIconSpriteVisible(true);
        }
    }

    private handleObjectPlace(event: RoomObjectMouseEvent, roomId: number): void
    {
        if(!event || !this._roomEngine) return;

        const eventDispatcher = GetEventDispatcher();

        if(!eventDispatcher) return;

        let selectedData = this.getSelectedRoomObjectData(roomId);

        if(!selectedData) return;

        let roomObject = this._roomEngine.getRoomObject(roomId, selectedData.id, selectedData.category);

        if(!roomObject)
        {
            if(event instanceof RoomObjectTileMouseEvent)
            {
                if(selectedData.category === RoomObjectCategory.FLOOR)
                {
                    this._roomEngine.addFurnitureFloor(roomId, selectedData.id, selectedData.typeId, selectedData.loc, selectedData.dir, 0, selectedData.stuffData, parseFloat(selectedData.instanceData), -1, 0, 0, '', false);
                }

                else if(selectedData.category === RoomObjectCategory.UNIT)
                {
                    this._roomEngine.addRoomObjectUser(roomId, selectedData.id, new Vector3d(), new Vector3d(180), 180, selectedData.typeId, selectedData.instanceData);

                    const roomObject = this._roomEngine.getRoomObject(roomId, selectedData.id, selectedData.category);

                    (roomObject && selectedData.posture && roomObject.model.setValue(RoomObjectVariable.FIGURE_POSTURE, selectedData.posture));
                }
            }

            else if(event instanceof RoomObjectWallMouseEvent)
            {
                if(selectedData.category === RoomObjectCategory.WALL)
                {
                    this._roomEngine.addFurnitureWall(roomId, selectedData.id, selectedData.typeId, selectedData.loc, selectedData.dir, 0, selectedData.instanceData, 0);
                }
            }

            roomObject = this._roomEngine.getRoomObject(roomId, selectedData.id, selectedData.category);

            if(roomObject)
            {
                if(selectedData.category === RoomObjectCategory.FLOOR)
                {
                    const allowedDirections = roomObject.model.getValue<number[]>(RoomObjectVariable.FURNITURE_ALLOWED_DIRECTIONS);

                    if(allowedDirections && allowedDirections.length)
                    {
                        const direction = new Vector3d(allowedDirections[0]);

                        roomObject.setDirection(direction);

                        this.updateSelectedObjectData(roomId, selectedData.id, selectedData.category, selectedData.loc, direction, selectedData.operation, selectedData.typeId, selectedData.instanceData, selectedData.stuffData, selectedData.state, selectedData.animFrame, selectedData.posture);

                        selectedData = this.getSelectedRoomObjectData(roomId);

                        if(!selectedData) return;
                    }
                }
            }

            this.setFurnitureAlphaMultiplier(roomObject, 0.5);
            this._roomEngine.setObjectMoverIconSpriteVisible(true);
        }

        if(roomObject)
        {
            let placementValid = true;

            const stackingHeightMap = this._roomEngine.getFurnitureStackingHeightMap(roomId);

            if(selectedData.category === RoomObjectCategory.FLOOR)
            {
                if(!((event instanceof RoomObjectTileMouseEvent) && this.handleFurnitureMove(roomObject, selectedData, Math.trunc(event.tileX + 0.5), Math.trunc(event.tileY + 0.5), stackingHeightMap)))
                {
                    this._roomEngine.removeRoomObjectFloor(roomId, selectedData.id);

                    placementValid = false;
                }
            }

            else if(selectedData.category === RoomObjectCategory.WALL)
            {
                placementValid = false;

                if(event instanceof RoomObjectWallMouseEvent)
                {
                    const wallLocation = event.wallLocation;
                    const wallWidth = event.wallWidth;
                    const wallHeight = event.wallHeight;
                    const x = event.x;
                    const y = event.y;
                    const direction = event.direction;

                    if(this.handleWallItemMove(roomObject, selectedData, wallLocation, wallWidth, wallHeight, x, y, direction))
                    {
                        placementValid = true;
                    }
                }

                if(!placementValid)
                {
                    this._roomEngine.removeRoomObjectWall(roomId, selectedData.id);
                }

                this._roomEngine.updateRoomObjectMask(roomId, selectedData.id, placementValid);
            }

            else if(selectedData.category === RoomObjectCategory.UNIT)
            {
                if(!((event instanceof RoomObjectTileMouseEvent) && this.handleUserPlace(roomObject, Math.trunc(event.tileX + 0.5), Math.trunc(event.tileY + 0.5), this._roomEngine.getLegacyWallGeometry(roomId))))
                {
                    this._roomEngine.removeRoomObjectUser(roomId, selectedData.id);

                    placementValid = false;
                }
            }

            this._roomEngine.setObjectMoverIconSpriteVisible(!placementValid);
        }
    }

    private handleFurnitureMove(roomObject: IRoomObjectController, selectedObjectData: ISelectedRoomObjectData, x: number, y: number, stackingHeightMap: IFurnitureStackingHeightMap): boolean
    {
        if(!roomObject || !selectedObjectData) return false;

        const originalDirection = new Vector3d();
        originalDirection.assign(roomObject.getDirection());

        roomObject.setDirection(selectedObjectData.dir);

        const targetLocation = new Vector3d(x, y, 0);
        const newDirection = new Vector3d();

        newDirection.assign(roomObject.getDirection());

        let validLocation = this.validateFurnitureLocation(roomObject, targetLocation, selectedObjectData.loc, selectedObjectData.dir, stackingHeightMap);

        if(!validLocation)
        {
            newDirection.x = this.getValidRoomObjectDirection(roomObject, true);

            roomObject.setDirection(newDirection);

            validLocation = this.validateFurnitureLocation(roomObject, targetLocation, selectedObjectData.loc, selectedObjectData.dir, stackingHeightMap);
        }

        if(!validLocation)
        {
            roomObject.setDirection(originalDirection);

            return false;
        }

        roomObject.setLocation(validLocation);

        if(newDirection) roomObject.setDirection(newDirection);

        return true;
    }

    private handleWallItemMove(roomObject: IRoomObjectController, selectedObjectData: ISelectedRoomObjectData, wallLocation: IVector3D, wallWidth: IVector3D, wallHeight: IVector3D, x: number, y: number, direction: number): boolean
    {
        if(!roomObject || !selectedObjectData) return false;

        const directionVector = new Vector3d(direction);
        const validLocation = this.validateWallItemLocation(roomObject, wallLocation, wallWidth, wallHeight, x, y, selectedObjectData);

        if(!validLocation) return false;

        roomObject.setLocation(validLocation);
        roomObject.setDirection(directionVector);

        return true;
    }

    private validateFurnitureLocation(roomObject: IRoomObject, targetLocation: IVector3D, currentLocation: IVector3D, currentDirection: IVector3D, stackingHeightMap: IFurnitureStackingHeightMap): Vector3d
    {
        if(!roomObject || !roomObject.model || !targetLocation) return null;

        let resultLocation: Vector3d = null;

        const direction = roomObject.getDirection();

        if(!direction) return null;

        if(!currentLocation || !currentDirection) return null;

        if((targetLocation.x === currentLocation.x) && (targetLocation.y === currentLocation.y))
        {
            if(direction.x === currentDirection.x)
            {
                resultLocation = new Vector3d();

                resultLocation.assign(currentLocation);

                return resultLocation;
            }
        }

        let sizeX = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_X);
        let sizeY = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Y);

        if(sizeX < 1) sizeX = 1;

        if(sizeY < 1) sizeY = 1;

        const baseX = currentLocation.x;
        const baseY = currentLocation.y;
        let currentSizeX = sizeX;
        let currentSizeY = sizeY;
        let temp = 0;
        let directionQuadrant = (Math.trunc((Math.trunc(direction.x + 45) % 360) / 90));

        if((directionQuadrant === 1) || (directionQuadrant === 3))
        {
            temp = sizeX;

            sizeX = sizeY;
            sizeY = temp;
        }

        directionQuadrant = Math.trunc((Math.trunc(currentDirection.x + 45) % 360) / 90);

        if((directionQuadrant === 1) || (directionQuadrant === 3))
        {
            temp = currentSizeX;
            currentSizeX = currentSizeY;
            currentSizeY = temp;
        }

        if(stackingHeightMap && targetLocation)
        {
            const stackable = (roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_ALWAYS_STACKABLE) === 1);

            if(stackingHeightMap.validateLocation(targetLocation.x, targetLocation.y, sizeX, sizeY, baseX, baseY, currentSizeX, currentSizeY, stackable))
            {
                return new Vector3d(targetLocation.x, targetLocation.y, stackingHeightMap.getTileHeight(targetLocation.x, targetLocation.y));
            }

            return null;
        }

        return null;
    }

    private validateWallItemLocation(roomObject: IRoomObject, wallLocation: IVector3D, wallWidth: IVector3D, wallHeight: IVector3D, x: number, y: number, selectedObjectData: ISelectedRoomObjectData): Vector3d
    {
        if((((((roomObject == null) || (roomObject.model == null)) || (wallLocation == null)) || (wallWidth == null)) || (wallHeight == null)) || (selectedObjectData == null)) return null;

        const sizeX = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_X);
        const sizeZ = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Z);
        const centerZ = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_CENTER_Z);

        if((((x < (sizeX / 2)) || (x > (wallWidth.length - (sizeX / 2)))) || (y < centerZ)) || (y > (wallHeight.length - (sizeZ - centerZ))))
        {
            if((x < (sizeX / 2)) && (x <= (wallWidth.length - (sizeX / 2))))
            {
                x = (sizeX / 2);
            }
            else
            {
                if((x >= (sizeX / 2)) && (x > (wallWidth.length - (sizeX / 2))))
                {
                    x = (wallWidth.length - (sizeX / 2));
                }
            }

            if((y < centerZ) && (y <= (wallHeight.length - (sizeZ - centerZ))))
            {
                y = centerZ;
            }
            else
            {
                if((y >= centerZ) && (y > (wallHeight.length - (sizeZ - centerZ))))
                {
                    y = (wallHeight.length - (sizeZ - centerZ));
                }
            }
        }

        if((((x < (sizeX / 2)) || (x > (wallWidth.length - (sizeX / 2)))) || (y < centerZ)) || (y > (wallHeight.length - (sizeZ - centerZ))))
        {
            return null;
        }

        let location = Vector3d.sum(Vector3d.product(wallWidth, (x / wallWidth.length)), Vector3d.product(wallHeight, (y / wallHeight.length)));

        location = Vector3d.sum(wallLocation, location);

        return location;
    }

    private changeObjectState(roomId: number, objectId: number, type: string, state: number, isRandom: boolean): void
    {
        const category = this._roomEngine.getRoomObjectCategoryForType(type);

        this.changeRoomObjectState(roomId, objectId, category, state, isRandom);
    }

    private useObject(roomId: number, objectId: number, type: string, action: string): void
    {
        if(!this._roomEngine || !GetCommunication().connection) return;
        switch(action)
        {
            case RoomObjectFurnitureActionEvent.DICE_ACTIVATE:
                GetCommunication().connection.send(new FurnitureDiceActivateComposer(objectId));
                return;
            case RoomObjectFurnitureActionEvent.DICE_OFF:
                GetCommunication().connection.send(new FurnitureDiceDeactivateComposer(objectId));
                return;
            case RoomObjectFurnitureActionEvent.USE_HABBOWHEEL:
                GetCommunication().connection.send(new FurnitureColorWheelComposer(objectId));
                return;
            case RoomObjectFurnitureActionEvent.STICKIE:
                GetCommunication().connection.send(new GetItemDataComposer(objectId));
                return;
            case RoomObjectFurnitureActionEvent.ENTER_ONEWAYDOOR:
                GetCommunication().connection.send(new FurnitureOneWayDoorComposer(objectId));
                return;
        }
    }

    private changeRoomObjectState(roomId: number, objectId: number, category: number, state: number, isRandom: boolean): boolean
    {
        if(!this._roomEngine || !GetCommunication().connection) return true;

        if(category === RoomObjectCategory.FLOOR)
        {
            const roomObject = this._roomEngine.getRoomObject(roomId, objectId, category);

            if(roomObject?.model && !isRandom)
            {
                const typeId = roomObject.model.getValue<number>(RoomObjectVariable.FURNITURE_TYPE_ID);

                if(!isNaN(typeId) && isWiredChestFloorItem(typeId))
                {
                    GetCommunication().connection.send(new ChestOpenComposer(objectId));

                    return true;
                }
            }

            if(!isRandom)
            {
                GetCommunication().connection.send(new FurnitureMultiStateComposer(objectId, state));
            }
            else
            {
                GetCommunication().connection.send(new FurnitureRandomStateComposer(objectId, state));
            }
        }

        else if(category === RoomObjectCategory.WALL)
        {
            GetCommunication().connection.send(new FurnitureWallMultiStateComposer(objectId, state));
        }

        return true;
    }

    private _walkDebounceTimer: ReturnType<typeof setTimeout> = null;
    private _lastWalkSentAt: number = 0;
    private static readonly WALK_MIN_INTERVAL_MS = 100;

    private sendWalkUpdate(x: number, y: number): void
    {
        if(!this._roomEngine || !GetCommunication().connection) return;

        if(this._walkDebounceTimer)
        {
            clearTimeout(this._walkDebounceTimer);
            this._walkDebounceTimer = null;
        }

        const now = Date.now();
        const elapsed = now - this._lastWalkSentAt;

        if(elapsed >= RoomObjectEventHandler.WALK_MIN_INTERVAL_MS)
        {
            this._lastWalkSentAt = now;
            GetCommunication().connection.send(new RoomUnitWalkComposer(x, y));
        }
        else
        {
            this._walkDebounceTimer = setTimeout(() =>
            {
                this._walkDebounceTimer = null;
                this._lastWalkSentAt = Date.now();
                GetCommunication().connection.send(new RoomUnitWalkComposer(x, y));
            }, RoomObjectEventHandler.WALK_MIN_INTERVAL_MS - elapsed);
        }
    }

    private handleMouseOverObject(category: number, roomId: number, event: RoomObjectMouseEvent): ObjectTileCursorUpdateMessage
    {
        if(category !== RoomObjectCategory.FLOOR) return null;

        const roomObject = this._roomEngine.getRoomObject(roomId, event.objectId, RoomObjectCategory.FLOOR);

        if(!roomObject) return null;

        const location = this.getActiveSurfaceLocation(roomObject, event);

        if(!location) return null;

        const furnitureHeightMap = this._roomEngine.getFurnitureStackingHeightMap(roomId);

        if(!furnitureHeightMap) return null;

        const x = location.x;
        const y = location.y;
        const z = location.z;

        return new ObjectTileCursorUpdateMessage(new Vector3d(x, y, roomObject.getLocation().z), z, true, event.eventId);
    }

    private handleMoveTargetFurni(roomId: number, event: RoomObjectMouseEvent): boolean
    {
        const roomObject = this._roomEngine.getRoomObject(roomId, event.objectId, RoomObjectCategory.FLOOR);
        const point = this.getActiveSurfaceLocation(roomObject, event);

        if(point && !this._roomEngine.moveBlocked)
        {
            this.sendWalkUpdate(point.x, point.y);

            return true;
        }

        return false;
    }

    private getActiveSurfaceLocation(roomObject: IRoomObject, event: RoomObjectMouseEvent): Vector3d
    {
        if(!roomObject || !event) return null;

        const furniData = GetSessionDataManager().getFloorItemDataByName(roomObject.type);

        if(!furniData) return null;

        if(!furniData.canStandOn && !furniData.canSitOn && !furniData.canLayOn) return null;

        const model = roomObject.model;

        if(!model) return null;

        const location = roomObject.getLocation();
        const direction = roomObject.getDirection();

        let sizeX = model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_X);
        let sizeY = model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Y);
        const sizeZ = model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Z);

        if((direction.x === 90) || (direction.x === 270)) [sizeX, sizeY] = [sizeY, sizeX];

        if(sizeX < 1) sizeX = 1;
        if(sizeY < 1) sizeY = 1;

        const renderingCanvas = this._roomEngine.getActiveRoomInstanceRenderingCanvas();

        if(!renderingCanvas) return null;

        const scale = renderingCanvas.geometry.scale;
        const sitOffset = furniData.canSitOn ? 0.5 : 0;
        const offsetX = ((((scale / 2) + event.spriteOffsetX) + event.localX) / (scale / 4));
        const offsetY = (((event.spriteOffsetY + event.localY) + (((sizeZ - sitOffset) * scale) / 2)) / (scale / 4));
        const deltaX = ((offsetX + (2 * offsetY)) / 4);
        const deltaY = ((offsetX - (2 * offsetY)) / 4);
        const tileX = Math.floor((location.x + deltaX));
        const tileY = Math.floor(((location.y - deltaY) + 1));

        let outOfBounds = false;

        if((tileX < location.x) || (tileX >= (location.x + sizeX))) outOfBounds = true;
        else if((tileY < location.y) || (tileY >= (location.y + sizeY))) outOfBounds = true;

        const tileZ = furniData.canSitOn ? (sizeZ - 0.5) : sizeZ;

        if(!outOfBounds) return new Vector3d(tileX, tileY, tileZ);

        return null;
    }

    private handleMouseOverTile(event: RoomObjectTileMouseEvent, roomId: number): ObjectTileCursorUpdateMessage
    {
        if(this.whereYouClickIsWhereYouGo())
        {
            return new ObjectTileCursorUpdateMessage(new Vector3d(event.tileXAsInt, event.tileYAsInt, event.tileZAsInt), 0, true, event.eventId);
        }

        const roomObject = this._roomEngine.getRoomObjectCursor(roomId);

        if(roomObject && roomObject.visualization)
        {
            const tileX = event.tileXAsInt;
            const tileY = event.tileYAsInt;
            const tileZ = event.tileZAsInt;
            const roomInstance = this._roomEngine.getRoomInstance(roomId);

            if(roomInstance)
            {
                const tileObjectMap = this._roomEngine.getRoomTileObjectMap(roomId);

                if(tileObjectMap)
                {
                    const tileObject = tileObjectMap.getObjectIntTile(tileX, tileY);
                    const stackingHeightMap = this._roomEngine.getFurnitureStackingHeightMap(roomId);

                    if(stackingHeightMap)
                    {
                        if(tileObject && tileObject.model && (tileObject.model.getValue<number>(RoomObjectVariable.FURNITURE_IS_VARIABLE_HEIGHT) > 0))
                        {
                            const tileHeight = stackingHeightMap.getTileHeight(tileX, tileY);
                            const wallHeight = this._roomEngine.getLegacyWallGeometry(roomId).getHeight(tileX, tileY);

                            return new ObjectTileCursorUpdateMessage(new Vector3d(tileX, tileY, tileZ), (tileHeight - wallHeight), true, event.eventId);
                        }

                        return new ObjectTileCursorUpdateMessage(new Vector3d(tileX, tileY, tileZ), 0, true, event.eventId);
                    }
                }
            }
        }

        return null;
    }

    private placeObject(roomId: number, isTileEvent: boolean, isWallEvent: boolean): void
    {
        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(!selectedData) return;

        let roomObject: IRoomObjectController = null;
        let objectId = selectedData.id;
        const category = selectedData.category;

        let x = 0;
        let y = 0;
        let z = 0;
        let direction = 0;
        let wallLocation = '';

        if(this._roomEngine && GetCommunication().connection)
        {
            roomObject = this._roomEngine.getRoomObject(roomId, objectId, category);

            if(roomObject)
            {
                const location = roomObject.getLocation();

                direction = roomObject.getDirection().x;

                if((category === RoomObjectCategory.FLOOR) || (category === RoomObjectCategory.UNIT))
                {
                    x = location.x;
                    y = location.y;
                    z = location.z;
                }

                else if(category === RoomObjectCategory.WALL)
                {
                    x = location.x;
                    y = location.y;
                    z = location.z;

                    const wallGeometry = this._roomEngine.getLegacyWallGeometry(roomId);

                    if(wallGeometry) wallLocation = wallGeometry.getOldLocationString(location, direction);
                }

                direction = ((((direction / 45) % 8) + 8) % 8);

                if((objectId < 0) && (category === RoomObjectCategory.UNIT)) objectId = (objectId * -1);

                if(this._objectPlacementSource !== RoomObjectPlacementSource.CATALOG)
                {
                    if(category === RoomObjectCategory.UNIT)
                    {
                        if(selectedData.typeId === RoomObjectType.PET)
                        {
                            GetCommunication().connection.send(new PetPlaceComposer(objectId, Math.trunc(x), Math.trunc(y)));
                        }

                        else if(selectedData.typeId === RoomObjectType.RENTABLE_BOT)
                        {
                            GetCommunication().connection.send(new BotPlaceComposer(objectId, Math.trunc(x), Math.trunc(y)));
                        }
                    }

                    else if(roomObject.model.getValue<string>(RoomObjectVariable.FURNITURE_IS_STICKIE) !== undefined)
                    {
                        GetCommunication().connection.send(new FurniturePostItPlaceComposer(objectId, wallLocation));
                    }

                    else
                    {
                        GetCommunication().connection.send(new FurniturePlaceComposer(objectId, category, wallLocation, Math.trunc(x), Math.trunc(y), direction));
                    }
                }
            }
        }

        this._roomEngine.setPlacedRoomObjectData(roomId, new SelectedRoomObjectData(selectedData.id, selectedData.category, null, selectedData.dir, null));

        this.resetSelectedObjectData(roomId);

        if(this._roomEngine && GetEventDispatcher())
        {
            const placedInRoom = (roomObject && (roomObject.id === selectedData.id));

            GetEventDispatcher().dispatchEvent(new RoomEngineObjectPlacedEvent(RoomEngineObjectEvent.PLACED, roomId, objectId, category, wallLocation, x, y, z, direction, placedInRoom, isTileEvent, isWallEvent, selectedData.instanceData));
        }
    }

    public modifyRoomObject(roomId: number, objectId: number, category: number, operation: string): boolean
    {
        if(!this._roomEngine) return false;

        const roomObject = this._roomEngine.getRoomObject(roomId, objectId, category);

        if(!roomObject) return false;

        let shouldReset = true;

        switch(operation)
        {
            case RoomObjectOperationType.OBJECT_ROTATE_POSITIVE:
            case RoomObjectOperationType.OBJECT_ROTATE_NEGATIVE:
                if(GetCommunication().connection)
                {
                    let direction = 0;

                    if(operation == RoomObjectOperationType.OBJECT_ROTATE_NEGATIVE)
                    {
                        direction = this.getValidRoomObjectDirection(roomObject, false);
                    }
                    else
                    {
                        direction = this.getValidRoomObjectDirection(roomObject, true);
                    }

                    const x = roomObject.getLocation().x;
                    const y = roomObject.getLocation().y;

                    if(this.isValidLocation(roomObject, new Vector3d(direction), this._roomEngine.getFurnitureStackingHeightMap(roomId)))
                    {
                        direction = Math.trunc((direction / 45));

                        if(roomObject.type === RoomObjectUserType.MONSTER_PLANT)
                        {
                            const roomSession = GetRoomSessionManager().getSession(roomId);

                            if(roomSession)
                            {
                                const userData = roomSession.userDataManager.getUserDataByIndex(objectId);

                                if(userData)
                                {
                                    GetCommunication().connection.send(new PetMoveComposer(userData.webID, Math.trunc(x), Math.trunc(y), direction));
                                }
                            }
                        }
                        else
                        {
                            GetCommunication().connection.send(new FurnitureFloorUpdateComposer(objectId, x, y, direction));
                        }
                    }
                }
                break;
            case RoomObjectOperationType.OBJECT_EJECT:
            case RoomObjectOperationType.OBJECT_PICKUP:
                if(GetCommunication().connection) GetCommunication().connection.send(new FurniturePickupComposer(category, objectId));
                break;
            case RoomObjectOperationType.OBJECT_PICKUP_PET:
                if(GetCommunication().connection)
                {
                    const session = GetRoomSessionManager().getSession(roomId);

                    if(session)
                    {
                        const userData = session.userDataManager.getUserDataByIndex(objectId);

                        session.pickupPet(userData.webID);
                    }
                }
                break;
            case RoomObjectOperationType.OBJECT_PICKUP_BOT:
                if(GetCommunication().connection)
                {
                    const session = GetRoomSessionManager().getSession(roomId);

                    if(session)
                    {
                        const userData = session.userDataManager.getUserDataByIndex(objectId);

                        session.pickupBot(userData.webID);
                    }
                }
                break;
            case RoomObjectOperationType.OBJECT_MOVE:
                shouldReset = false;
                this.setFurnitureAlphaMultiplier(roomObject, 0.5);
                this.setSelectedRoomObjectData(roomId, roomObject.id, category, roomObject.getLocation(), roomObject.getDirection(), operation);
                this._roomEngine.setObjectMoverIconSprite(roomObject.id, category, true);
                this._roomEngine.setObjectMoverIconSpriteVisible(false);
                break;
            case RoomObjectOperationType.OBJECT_MOVE_TO: {
                const selectedData = this.getSelectedRoomObjectData(roomId);

                this.updateSelectedObjectData(roomId, selectedData.id, selectedData.category, selectedData.loc, selectedData.dir, RoomObjectOperationType.OBJECT_MOVE_TO, selectedData.typeId, selectedData.instanceData, selectedData.stuffData, selectedData.state, selectedData.animFrame, selectedData.posture);
                this.setFurnitureAlphaMultiplier(roomObject, 1);
                this._roomEngine.removeObjectMoverIconSprite();

                if(GetCommunication().connection)
                {
                    if(category === RoomObjectCategory.FLOOR)
                    {
                        const angle = ((roomObject.getDirection().x) % 360);
                        const location = roomObject.getLocation();
                        const direction = (angle / 45);

                        GetCommunication().connection.send(new FurnitureFloorUpdateComposer(objectId, location.x, location.y, direction));
                    }

                    else if(category === RoomObjectCategory.WALL)
                    {
                        const angle = ((roomObject.getDirection().x) % 360);
                        const wallGeometry = this._roomEngine.getLegacyWallGeometry(roomId);

                        if(wallGeometry)
                        {
                            const location = wallGeometry.getOldLocationString(roomObject.getLocation(), angle);

                            if(location) GetCommunication().connection.send(new FurnitureWallUpdateComposer(objectId, location));
                        }
                    }

                    else if(category === RoomObjectCategory.UNIT)
                    {
                        const angle = ((roomObject.getDirection().x) % 360);
                        const location = roomObject.getLocation();
                        const direction = (angle / 45);
                        const race = parseInt(roomObject.model.getValue<string>(RoomObjectVariable.RACE));
                        const roomSession = GetRoomSessionManager().getSession(roomId);

                        if(roomSession)
                        {
                            const userData = roomSession.userDataManager.getUserDataByIndex(objectId);

                            if(userData) GetCommunication().connection.send(new PetMoveComposer(userData.webID, location.x, location.y, direction));
                        }
                    }
                }

                break;
            }
        }

        if(shouldReset) this.resetSelectedObjectData(roomId);

        return true;
    }

    public modifyRoomObjectDataWithMap(roomId: number, objectId: number, category: number, operation: string, data: Map<string, string>): boolean
    {
        if(!this._roomEngine) return false;

        const roomObject = this._roomEngine.getRoomObject(roomId, objectId, category);

        if(!roomObject) return false;

        switch(operation)
        {
            case RoomObjectOperationType.OBJECT_SAVE_STUFF_DATA:
                if(GetCommunication().connection)
                {
                    GetCommunication().connection.send(new SetObjectDataMessageComposer(objectId, data));
                }
                break;
        }

        return true;
    }

    public modifyWallItemData(roomId: number, objectId: number, colorHex: string, text: string): boolean
    {
        if(!this._roomEngine || !GetCommunication().connection) return false;

        GetCommunication().connection.send(new SetItemDataMessageComposer(objectId, colorHex, text));

        return true;
    }

    public deleteWallItem(roomId: number, itemId: number): boolean
    {
        if(!this._roomEngine || !GetCommunication().connection) return false;

        GetCommunication().connection.send(new RemoveWallItemComposer(itemId));

        return true;
    }

    public getValidRoomObjectDirection(roomObject: IRoomObjectController, clockwise: boolean): number
    {
        if(!roomObject || !roomObject.model) return 0;

        let directionIndex = 0;
        let i = 0;
        let allowedDirections: number[] = [];

        if(roomObject.type === RoomObjectUserType.MONSTER_PLANT)
        {
            allowedDirections = roomObject.model.getValue<number[]>(RoomObjectVariable.PET_ALLOWED_DIRECTIONS);
        }
        else
        {
            allowedDirections = roomObject.model.getValue<number[]>(RoomObjectVariable.FURNITURE_ALLOWED_DIRECTIONS);
        }

        let direction = roomObject.getDirection().x;

        if(allowedDirections && allowedDirections.length)
        {
            directionIndex = allowedDirections.indexOf(direction);

            if(directionIndex < 0)
            {
                directionIndex = 0;
                i = 0;

                while(i < allowedDirections.length)
                {
                    if(direction <= allowedDirections[i]) break;

                    directionIndex++;
                    i++;
                }

                directionIndex = (directionIndex % allowedDirections.length);
            }

            if(clockwise) directionIndex = ((directionIndex + 1) % allowedDirections.length);
            else directionIndex = (((directionIndex - 1) + allowedDirections.length) % allowedDirections.length);

            direction = allowedDirections[directionIndex];
        }

        return direction;
    }

    private isValidLocation(object: IRoomObject, goalDirection: IVector3D, stackingHeightMap: IFurnitureStackingHeightMap): boolean
    {
        if(!object || !object.model || !goalDirection) return false;

        const direction = object.getDirection();
        const location = object.getLocation();

        if(!direction || !location) return false;

        if((direction.x % 180) === (goalDirection.x % 180)) return true;

        let sizeX = object.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_X);
        let sizeY = object.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Y);

        if(sizeX < 1) sizeX = 1;

        if(sizeY < 1) sizeY = 1;

        let baseSizeX = sizeX;
        let baseSizeY = sizeY;

        let directionQuadrant = (Math.trunc((Math.trunc((goalDirection.x + 45)) % 360) / 90));

        if((directionQuadrant === 1) || (directionQuadrant === 3)) [sizeX, sizeY] = [sizeY, sizeX];

        directionQuadrant = (Math.trunc((Math.trunc((direction.x + 45)) % 360) / 90));

        if(((directionQuadrant === 1) || (directionQuadrant === 3))) [baseSizeX, baseSizeY] = [baseSizeY, baseSizeX];

        if(stackingHeightMap && location)
        {
            const alwaysStackable = (object.model.getValue<number>(RoomObjectVariable.FURNITURE_ALWAYS_STACKABLE) === 1);

            if(stackingHeightMap.validateLocation(location.x, location.y, sizeX, sizeY, location.x, location.y, baseSizeX, baseSizeY, alwaysStackable, location.z)) return true;
        }

        return false;
    }

    private placeObjectOnUser(roomId: number, objectId: number, category: number): void
    {
        const objectData = this.getSelectedRoomObjectData(roomId);

        if(!objectData) return;

        const roomObjectController = this._roomEngine.getRoomObject(roomId, objectId, category);

        if(!roomObjectController) return;

        if(!this._roomEngine || !GetEventDispatcher()) return;

        GetEventDispatcher().dispatchEvent(new RoomEngineObjectPlacedOnUserEvent(RoomEngineObjectEvent.PLACED_ON_USER, roomId, objectId, category, objectData.id, objectData.category));
    }

    public setSelectedObject(roomId: number, objectId: number, category: number): void
    {
        if(!this._roomEngine) return;

        const eventDispatcher = GetEventDispatcher();

        if(!eventDispatcher) return;

        switch(category)
        {
            case RoomObjectCategory.UNIT:
            case RoomObjectCategory.FLOOR:
            case RoomObjectCategory.WALL:
                if(category === RoomObjectCategory.UNIT)
                {
                    this.deselectObject(roomId);
                    this.setSelectedAvatar(roomId, objectId, true);
                }
                else
                {
                    this.setSelectedAvatar(roomId, 0, false);

                    if(objectId !== this._selectedObjectId)
                    {
                        this.deselectObject(roomId);

                        const roomObject = this._roomEngine.getRoomObject(roomId, objectId, category);

                        if(roomObject && roomObject.logic)
                        {
                            roomObject.logic.processUpdateMessage(new ObjectSelectedMessage(true));

                            this._selectedObjectId = objectId;
                            this._selectedObjectCategory = category;
                        }
                    }
                }

                GetEventDispatcher().dispatchEvent(new RoomEngineObjectEvent(RoomEngineObjectEvent.SELECTED, roomId, objectId, category));

                return;
        }
    }

    private deselectObject(roomId: number): void
    {
        if(this._selectedObjectId === -1) return;

        const object = this._roomEngine.getRoomObject(roomId, this._selectedObjectId, this._selectedObjectCategory);

        if(object && object.logic)
        {
            object.logic.processUpdateMessage(new ObjectSelectedMessage(false));

            this._selectedObjectId = -1;
            this._selectedObjectCategory = RoomObjectCategory.MINIMUM;
        }
    }

    public setSelectedAvatar(roomId: number, objectId: number, select: boolean): void
    {
        if(!this._roomEngine) return;

        this.clearPendingAvatarLook();

        const category = RoomObjectCategory.UNIT;
        const previousAvatar = this._roomEngine.getRoomObject(roomId, this._selectedAvatarId, category);

        if(previousAvatar && previousAvatar.logic)
        {
            previousAvatar.logic.processUpdateMessage(new ObjectAvatarSelectedMessage(false));

            this._selectedAvatarId = -1;
        }

        let avatarSelected = false;

        if(select)
        {
            const targetAvatar = this._roomEngine.getRoomObject(roomId, objectId, category);

            if(targetAvatar && targetAvatar.logic)
            {
                targetAvatar.logic.processUpdateMessage(new ObjectAvatarSelectedMessage(true));

                avatarSelected = true;

                this._selectedAvatarId = objectId;

                const location = targetAvatar.getLocation();

                if(location)
                {
                    this._pendingAvatarLookTimeout = setTimeout(() =>
                    {
                        this._pendingAvatarLookTimeout = null;

                        if(this.shouldSuppressAvatarLook()) return;
                        if(this._selectedAvatarId !== objectId) return;

                        GetCommunication().connection.send(new RoomUnitLookComposer(~~(location.x), ~~(location.y)));
                    }, RoomObjectEventHandler.CLICK_USER_LOOK_DELAY_MS);
                }
            }
        }

        const selectionArrow = this._roomEngine.getRoomObjectSelectionArrow(roomId);

        if(selectionArrow && selectionArrow.logic)
        {
            if(avatarSelected && !this._roomEngine.isPlayingGame()) selectionArrow.logic.processUpdateMessage(new ObjectVisibilityUpdateMessage(ObjectVisibilityUpdateMessage.ENABLED));
            else selectionArrow.logic.processUpdateMessage(new ObjectVisibilityUpdateMessage(ObjectVisibilityUpdateMessage.DISABLED));
        }
    }

    public clearSelectedAvatar(roomId: number): void
    {
        this.setSelectedAvatar(roomId, 0, false);
    }

    private clearPendingAvatarLook(): void
    {
        if(!this._pendingAvatarLookTimeout) return;

        clearTimeout(this._pendingAvatarLookTimeout);
        this._pendingAvatarLookTimeout = null;
    }

    private shouldSuppressAvatarLook(): boolean
    {
        const control = (globalThis as any).__nitroAvatarClickControl;

        return !!control && (control.suppressRotateUntil > Date.now());
    }

    private resetSelectedObjectData(roomId: number): void
    {
        if(!this._roomEngine) return;

        this._roomEngine.removeObjectMoverIconSprite();

        const selectedData = this.getSelectedRoomObjectData(roomId);

        if(selectedData)
        {
            if((selectedData.operation === RoomObjectOperationType.OBJECT_MOVE) || (selectedData.operation === RoomObjectOperationType.OBJECT_MOVE_TO))
            {
                const roomObject = this._roomEngine.getRoomObject(roomId, selectedData.id, selectedData.category);

                if(roomObject && (selectedData.operation !== RoomObjectOperationType.OBJECT_MOVE_TO))
                {
                    roomObject.setLocation(selectedData.loc);
                    roomObject.setDirection(selectedData.dir);
                }

                this.setFurnitureAlphaMultiplier(roomObject, 1);

                if(selectedData.category === RoomObjectCategory.WALL)
                {
                    this._roomEngine.updateRoomObjectMask(roomId, selectedData.id, true);
                }

                this.updateSelectedObjectData(roomId, selectedData.id, selectedData.category, selectedData.loc, selectedData.dir, RoomObjectOperationType.OBJECT_MOVE, selectedData.typeId, selectedData.instanceData, selectedData.stuffData, selectedData.state, selectedData.animFrame, selectedData.posture);
            }

            else if((selectedData.operation === RoomObjectOperationType.OBJECT_PLACE))
            {
                const objectId = selectedData.id;
                const category = selectedData.category;

                switch(category)
                {
                    case RoomObjectCategory.FLOOR:
                        this._roomEngine.removeRoomObjectFloor(roomId, objectId);
                        break;
                    case RoomObjectCategory.WALL:
                        this._roomEngine.removeRoomObjectWall(roomId, objectId);
                        break;
                    case RoomObjectCategory.UNIT:
                        this._roomEngine.removeRoomObjectUser(roomId, objectId);
                        break;
                }
            }

            this._roomEngine.setSelectedRoomObjectData(roomId, null);
        }
    }

    private getSelectedRoomObjectData(roomId: number): ISelectedRoomObjectData
    {
        if(!this._roomEngine) return null;

        return this._roomEngine.getSelectedRoomObjectData(roomId);
    }

    private setFurnitureAlphaMultiplier(object: IRoomObjectController, multiplier: number): void
    {
        if(!object || !object.model) return;

        object.model.setValue(RoomObjectVariable.FURNITURE_ALPHA_MULTIPLIER, multiplier);
    }

    private decorateModeMove(event: RoomObjectMouseEvent): boolean
    {
        return (this._roomEngine.isDecorating) && (!(event.ctrlKey || event.shiftKey));
    }

    public cancelRoomObjectPlacement(roomId: number): boolean
    {
        this.resetSelectedObjectData(roomId);

        return true;
    }

    private setSelectedRoomObjectData(roomId: number, id: number, category: number, location: IVector3D, direction: IVector3D, operation: string, typeId: number = 0, instanceData: string = null, stuffData: IObjectData = null, state: number = -1, frameNumber: number = -1, posture: string = null): void
    {
        this.resetSelectedObjectData(roomId);

        if(!this._roomEngine) return;

        const selectedData = new SelectedRoomObjectData(id, category, operation, location, direction, typeId, instanceData, stuffData, state, frameNumber, posture);

        this._roomEngine.setSelectedRoomObjectData(roomId, selectedData);
    }

    private updateSelectedObjectData(roomId: number, id: number, category: number, location: IVector3D, direction: IVector3D, operation: string, typeId: number = 0, instanceData: string = null, stuffData: IObjectData = null, state: number = -1, frameNumber: number = -1, posture: string = null): void
    {
        if(!this._roomEngine) return null;

        const selectedData = new SelectedRoomObjectData(id, category, operation, location, direction, typeId, instanceData, stuffData, state, frameNumber, posture);

        this._roomEngine.setSelectedRoomObjectData(roomId, selectedData);
    }

    private handleUserPlace(roomObject: IRoomObjectController, x: number, y: number, wallGeometry: ILegacyWallGeometry): boolean
    {
        if(!wallGeometry.isRoomTile(x, y)) return false;

        roomObject.setLocation(new Vector3d(x, y, wallGeometry.getHeight(x, y)));

        return true;
    }

    public get engine(): IRoomEngineServices
    {
        return this._roomEngine;
    }

    public get selectedAvatarId(): number
    {
        return this._selectedAvatarId;
    }

    public whereYouClickIsWhereYouGo(): boolean
    {
        return this._roomEngine.whereYouClickIsWhereYouGo();
    }
}
