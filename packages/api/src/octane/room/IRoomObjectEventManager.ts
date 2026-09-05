import { IRoomObjectController } from '../../room';

export interface IRoomObjectEventManager
{
    getValidRoomObjectDirection(roomObject: IRoomObjectController, clockwise: boolean): number;
}
