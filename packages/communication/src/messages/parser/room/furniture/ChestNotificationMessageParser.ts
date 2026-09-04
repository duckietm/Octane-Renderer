import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

/**
 * Something happened to a chest its owner asked to hear about.
 * Wire layout: int chestId, int reason, string chestName, string actorName, int amount.
 *
 * The chest's name travels with it because this is read somewhere else -- the owner may be in another
 * room entirely, where "your chest" needs to say which one.
 */
export class ChestNotificationMessageParser implements IMessageParser
{
    public static REASON_FULL: number = 0;
    public static REASON_DONATION: number = 1;
    public static REASON_WITHDRAW: number = 2;
    public static REASON_EMPTY: number = 3;
    public static REASON_WIRED: number = 4;

    private _chestId: number = -1;
    private _reason: number = -1;
    private _chestName: string = '';
    private _actorName: string = '';
    private _amount: number = 0;

    public flush(): boolean
    {
        this._chestId = -1;
        this._reason = -1;
        this._chestName = '';
        this._actorName = '';
        this._amount = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._chestId = wrapper.readInt();
        this._reason = wrapper.readInt();
        this._chestName = wrapper.readString();
        this._actorName = wrapper.readString();
        this._amount = wrapper.readInt();

        return true;
    }

    public get chestId(): number
    {
        return this._chestId;
    }
    public get reason(): number
    {
        return this._reason;
    }
    public get chestName(): string
    {
        return this._chestName;
    }
    public get actorName(): string
    {
        return this._actorName;
    }
    public get amount(): number
    {
        return this._amount;
    }
}
