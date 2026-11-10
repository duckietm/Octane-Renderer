import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * Official claim result (43): `(claimId, result)`, the answer to a free claim. The cursed dragon
 * adoption window reads 0 and 1 as claimed, 2 and 3 as not available and anything else as "try again".
 */
export class ClaimProductResultParser implements IMessageParser
{
    public static RESULT_CLAIMED: number = 0;
    public static RESULT_ALREADY_CLAIMED: number = 1;
    public static RESULT_UNAVAILABLE: number = 2;
    public static RESULT_INVALID_CHOICE: number = 3;

    private _claimId: string;
    private _result: number;

    public flush(): boolean
    {
        this._claimId = null;
        this._result = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._claimId = wrapper.readString();
        this._result = wrapper.readInt();

        return true;
    }

    public get claimId(): string
    {
        return this._claimId;
    }

    public get result(): number
    {
        return this._result;
    }
}
