import { IMessageDataWrapper } from '@octane/api';

export class BadgeAndPointLimit
{
    private _badgeId: string;
    private _limit: number;

    constructor(badgeCode: string, wrapper: IMessageDataWrapper)
    {
        if(!wrapper) throw new Error('invalid_parser');

        this._badgeId = (('ACH_' + badgeCode) + wrapper.readInt());
        this._limit = wrapper.readInt();
    }

    public get badgeId(): string
    {
        return this._badgeId;
    }

    public get limit(): number
    {
        return this._limit;
    }
}
