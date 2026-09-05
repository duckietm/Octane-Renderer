import { IVector3D } from '../../../utils';

export interface ILegacyWallGeometry
{
    dispose: () => void;
    readonly disposed: boolean;
    scale: number;
    initialize(width: number, height: number, floorHeight: number): void;
    setHeight(x: number, y: number, height: number): boolean;
    getHeight(x: number, y: number): number;
    getLocation(width: number, height: number, localX: number, localY: number, direction: string): IVector3D;
    getLocationOldFormat(x: number, y: number, direction: string): IVector3D;
    getOldLocation(location: IVector3D, direction: number): [number, number, number, number, string];
    getOldLocationString(location: IVector3D, direction: number): string;
    getDirection(wallLocation: string): number;
    getFloorAltitude(x: number, y: number): number;
    isRoomTile(x: number, y: number): boolean;
}
