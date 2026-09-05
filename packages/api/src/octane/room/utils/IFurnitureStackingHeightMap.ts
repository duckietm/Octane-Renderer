export interface IFurnitureStackingHeightMap
{
    dispose: () => void;
    getTileHeight(x: number, y: number): number;
    setTileHeight(x: number, y: number, height: number): void;
    setStackingBlocked(x: number, y: number, isNotStackable: boolean): void;
    setIsRoomTile(x: number, y: number, isRoomTile: boolean): void;
    validateLocation(x: number, y: number, sizeX: number, sizeY: number, areaX: number, areaY: number, areaWidth: number, areaHeight: number, stackable: boolean, altitude?: number): boolean;
    readonly width: number;
    readonly height: number;
}
