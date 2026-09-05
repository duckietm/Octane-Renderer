import { IRoomObject } from '@octane/api';
import { RoomObjectEvent } from './RoomObjectEvent';

export class RoomObjectFloorHoleEvent extends RoomObjectEvent
{
    public static ADD_HOLE: string = 'ROFHO_ADD_HOLE';
    public static REMOVE_HOLE: string = 'ROFHO_REMOVE_HOLE';

    constructor(type: string, object: IRoomObject)
    {
        super(type, object);
    }
}
