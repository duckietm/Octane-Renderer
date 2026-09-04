import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

/**
 * The answer to a capacity purchase. Wire layout: int chestId, int resultCode.
 *
 * Zero is the only success. Every other code names a refusal the window renders as
 * `wiredchests.upgrade.result.error.<code>`, so a purchase that cannot go through says why instead
 * of looking like a click that went nowhere.
 */
export class ChestUpgradeResultMessageParser implements IMessageParser
{
    private _chestId: number = -1;
    private _resultCode: number = -1;

    public flush(): boolean
    {
        this._chestId = -1;
        this._resultCode = -1;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._chestId = wrapper.readInt();
        this._resultCode = wrapper.readInt();

        return true;
    }

    public get chestId(): number
    {
        return this._chestId;
    }
    public get resultCode(): number
    {
        return this._resultCode;
    }
    public get successful(): boolean
    {
        return this._resultCode === 0;
    }
}
