import { IRoomInstance, IRoomObjectController, IRoomRenderingCanvas } from '../../room';
import { IVector3D } from '../../utils';
import { ISelectedRoomObjectData } from './ISelectedRoomObjectData';
import { IObjectData } from './object';
import { IFurnitureStackingHeightMap, ILegacyWallGeometry, IRoomAreaSelectionManager, ITileObjectMap } from './utils';

export interface IRoomEngineServices
{
    getRoomInstance(roomId: number): IRoomInstance;
    getActiveRoomInstanceRenderingCanvas(): IRoomRenderingCanvas;
    addRoomInstanceFloorHole(roomId: number, objectId: number): void;
    removeRoomInstanceFloorHole(roomId: number, objectId: number): void;
    getSelectedRoomObjectData(roomId: number): ISelectedRoomObjectData;
    setSelectedRoomObjectData(roomId: number, data: ISelectedRoomObjectData): void;
    getPlacedRoomObjectData(roomId: number): ISelectedRoomObjectData;
    setPlacedRoomObjectData(roomId: number, data: ISelectedRoomObjectData): void;
    getLegacyWallGeometry(roomId: number): ILegacyWallGeometry;
    getFurnitureStackingHeightMap(roomId: number): IFurnitureStackingHeightMap;
    getRoomObject(roomId: number, objectId: number, category: number): IRoomObjectController;
    getRoomObjectByIndex(roomId: number, index: number, category: number): IRoomObjectController;
    getRoomObjectCategoryForType(type: string): number;
    getRoomObjectCursor(roomId: number): IRoomObjectController;
    getRoomObjectSelectionArrow(roomId: number): IRoomObjectController;
    addRoomObjectUser(roomId: number, objectId: number, location: IVector3D, direction: IVector3D, headDirection: number, type: number, figure: string): boolean;
    addFurnitureFloor(roomId: number, id: number, typeId: number, location: IVector3D, direction: IVector3D, state: number, objectData: IObjectData, extra?: number, expires?: number, usagePolicy?: number, ownerId?: number, ownerName?: string, synchronized?: boolean, realRoomObject?: boolean, sizeZ?: number, allowStack?: boolean, allowSit?: boolean, allowLay?: boolean, allowWalk?: boolean, dimensionsX?: number, dimensionsY?: number, teleportTargetId?: number): boolean;
    addFurnitureFloorByTypeName(roomId: number, id: number, typeName: string, location: IVector3D, direction: IVector3D, state: number, objectData: IObjectData, extra?: number, expires?: number, usagePolicy?: number, ownerId?: number, ownerName?: string, synchronized?: boolean, realRoomObject?: boolean, sizeZ?: number, allowStack?: boolean, allowSit?: boolean, allowLay?: boolean, allowWalk?: boolean, dimensionsX?: number, dimensionsY?: number, teleportTargetId?: number): boolean;
    addFurnitureWall(roomId: number, id: number, typeId: number, location: IVector3D, direction: IVector3D, state: number, extra: string, expires?: number, usagePolicy?: number, ownerId?: number, ownerName?: string, realRoomObject?: boolean, allowStack?: boolean, allowSit?: boolean, allowLay?: boolean, allowWalk?: boolean, dimensionsX?: number, dimensionsY?: number, teleportTargetId?: number): boolean;
    removeRoomObjectFloor(roomId: number, objectId: number, userId?: number, dispatchToWiredHandler?: boolean): void;
    removeRoomObjectWall(roomId: number, objectId: number, userId?: number): void;
    removeRoomObjectUser(roomId: number, objectId: number): void;
    loadRoomObjectBadgeImage(roomId: number, objectId: number, objectCategory: number, badgeId: string, groupBadge?: boolean): void;
    updateRoomObjectMask(roomId: number, objectId: number, visible?: boolean): void;
    setObjectMoverIconSprite(objectId: number, category: number, useObjectImage: boolean, instanceData?: string, stuffData?: IObjectData, state?: number, frameNumber?: number, posture?: string): void;
    setObjectMoverIconSpriteVisible(visible: boolean): void;
    updateMousePointer(type: string, objectId: number, objectType: string): void;
    removeObjectMoverIconSprite(): void;
    getRoomTileObjectMap(roomId: number): ITileObjectMap;
    isPlayingGame(): boolean;
    activeRoomId: number;
    isDecorating: boolean;
    moveBlocked: boolean;
    isAreaSelectionMode(): boolean;
    whereYouClickIsWhereYouGo(): boolean;
    areaSelectionManager: IRoomAreaSelectionManager;
}
