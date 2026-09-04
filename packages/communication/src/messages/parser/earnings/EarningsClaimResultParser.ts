import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';
import { IEarningsEntry, readEarningsEntry } from './EarningsCenterParser';

export interface IEarningsClaimResult
{
    categoryKey: string;
    status: string; // success | disabled | unknown_category | already_claimed | no_reward | error
    success: boolean;
    hasEntry: boolean;
    entry: IEarningsEntry | null; // refreshed entry when hasEntry === true
}

export class EarningsClaimResultParser implements IMessageParser
{
    private _results: IEarningsClaimResult[] = [];

    public flush(): boolean
    {
        this._results = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();
        this._results = [];

        for(let i = 0; i < count; i++)
        {
            const categoryKey = wrapper.readString();
            const status = wrapper.readString();
            const success = wrapper.readBoolean();
            const hasEntry = wrapper.readBoolean();
            const entry = hasEntry ? readEarningsEntry(wrapper) : null;

            this._results.push({ categoryKey, status, success, hasEntry, entry });
        }

        return true;
    }

    public get results(): IEarningsClaimResult[]
    {
        return this._results;
    }
}
