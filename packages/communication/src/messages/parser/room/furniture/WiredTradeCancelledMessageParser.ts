import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

/** The player walked away themselves; the window says nothing about it. */
export const WIRED_TRADE_FAILURE_SILENT = 0;
export const WIRED_TRADE_FAILURE_TIMEOUT = 1;
export const WIRED_TRADE_FAILURE_REQUIREMENTS = 2;
export const WIRED_TRADE_FAILURE_LEFT_ROOM = 3;
export const WIRED_TRADE_FAILURE_CONTRACT_GONE = 4;
export const WIRED_TRADE_FAILURE_REWARD_UNAVAILABLE = 5;

/** The negotiation ended without settling. Wire layout: int failureId. */
export class WiredTradeCancelledMessageParser implements IMessageParser
{
    private _failureId: number = WIRED_TRADE_FAILURE_SILENT;

    public flush(): boolean
    {
        this._failureId = WIRED_TRADE_FAILURE_SILENT;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._failureId = wrapper.readInt();

        return true;
    }

    public get failureId(): number
    {
        return this._failureId;
    }
}
