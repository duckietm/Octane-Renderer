import { IRoomObject } from '../../../room';

export interface ITileObjectMap
{
    clear(): void;
    populate(objects: IRoomObject[]): void;
    dispose(): void;
    getObjectIntTile(x: number, y: number): IRoomObject;
    setObjectInTile(x: number, y: number, object: IRoomObject): void;
    addRoomObject(object: IRoomObject): void;
}
