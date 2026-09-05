import { IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';

export class RoomSessionPropertyUpdateEvent extends RoomSessionEvent
{
    public static RSDUE_ALLOW_PETS: string = 'RSDUE_ALLOW_PETS';

    constructor(type: string, session: IRoomSession)
    {
        super(type, session);
    }
}
