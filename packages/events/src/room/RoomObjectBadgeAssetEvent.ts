import { IRoomObject } from '@octane/api';
import { RoomObjectEvent } from './RoomObjectEvent';

export class RoomObjectBadgeAssetEvent extends RoomObjectEvent
{
    public static LOAD_BADGE: string = 'ROBAE_LOAD_BADGE';

    private _badgeId: string;
    private _groupBadge: boolean;

    constructor(type: string, object: IRoomObject, badgeId: string, groupBadge: boolean = true)
    {
        super(type, object);

        this._badgeId = badgeId;
        this._groupBadge = groupBadge;
    }

    public get badgeId(): string
    {
        return this._badgeId;
    }

    public get groupBadge(): boolean
    {
        return this._groupBadge;
    }
}
