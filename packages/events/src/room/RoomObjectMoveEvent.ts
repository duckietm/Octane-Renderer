import { IRoomObject } from '@octane/api';
import { RoomObjectEvent } from './RoomObjectEvent';

export class RoomObjectMoveEvent extends RoomObjectEvent
{
    public static POSITION_CHANGED: string = 'ROME_POSITION_CHANGED';
    public static OBJECT_REMOVED: string = 'ROME_OBJECT_REMOVED';

    constructor(type: string, object: IRoomObject)
    {
        super(type, object);
    }
}
