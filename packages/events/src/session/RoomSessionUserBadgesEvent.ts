import { IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';

export class RoomSessionUserBadgesEvent extends RoomSessionEvent
{
    public static RSUBE_BADGES: string = 'RSUBE_BADGES';

    private _userId: number = 0;
    private _badges: string[];

    constructor(session: IRoomSession, userId: number, badges: string[])
    {
        super(RoomSessionUserBadgesEvent.RSUBE_BADGES, session);

        this._badges = [];
        this._userId = userId;
        this._badges = badges;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get badges(): string[]
    {
        return this._badges;
    }
}
