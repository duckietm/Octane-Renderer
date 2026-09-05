import { OctaneEvent } from '../core';

export class RoomSessionUserTagsEvent extends OctaneEvent
{
    public static UTRE_USER_TAGS_RECEIVED: string = 'UTRE_USER_TAGS_RECEIVED';

    private _userId: number;
    private _tags: string[];

    constructor(userId: number, tags: string[])
    {
        super(RoomSessionUserTagsEvent.UTRE_USER_TAGS_RECEIVED);

        this._userId = userId;
        this._tags = tags;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get tags(): string[]
    {
        return this._tags;
    }
}
