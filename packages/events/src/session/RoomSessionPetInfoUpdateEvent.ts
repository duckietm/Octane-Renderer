import { IRoomPetData, IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';

export class RoomSessionPetInfoUpdateEvent extends RoomSessionEvent
{
    public static PET_INFO: string = 'RSPIUE_PET_INFO';

    private _petInfo: IRoomPetData;

    constructor(session: IRoomSession, petInfo: IRoomPetData)
    {
        super(RoomSessionPetInfoUpdateEvent.PET_INFO, session);

        this._petInfo = petInfo;
    }

    public get petInfo(): IRoomPetData
    {
        return this._petInfo;
    }
}
