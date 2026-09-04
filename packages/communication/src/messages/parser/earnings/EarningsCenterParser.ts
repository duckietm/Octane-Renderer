import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export interface IEarningsReward
{
    type: string; // credits | pixels | points | badge | item | hc_days
    amount: number;
    pointsType: number; // currency type when type === 'points'
    data: string; // badge code (badge), items_base.id (item), else ''
}

export interface IEarningsEntry
{
    categoryKey: string;
    enabled: boolean;
    claimable: boolean;
    nextClaimAt: number;
    rewards: IEarningsReward[];
}

// Shared entry reader — the claim-result parser embeds the same shape.
export function readEarningsEntry(wrapper: IMessageDataWrapper): IEarningsEntry
{
    const categoryKey = wrapper.readString();
    const enabled = wrapper.readBoolean();
    const claimable = wrapper.readBoolean();
    const nextClaimAt = wrapper.readInt();

    const rewardCount = wrapper.readInt();
    const rewards: IEarningsReward[] = [];

    for(let i = 0; i < rewardCount; i++)
    {
        rewards.push({
            type: wrapper.readString(),
            amount: wrapper.readInt(),
            pointsType: wrapper.readInt(),
            data: wrapper.readString()
        });
    }

    return { categoryKey, enabled, claimable, nextClaimAt, rewards };
}

export class EarningsCenterParser implements IMessageParser
{
    private _entries: IEarningsEntry[] = [];

    public flush(): boolean
    {
        this._entries = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();
        this._entries = [];

        for(let i = 0; i < count; i++) this._entries.push(readEarningsEntry(wrapper));

        return true;
    }

    public get entries(): IEarningsEntry[]
    {
        return this._entries;
    }
}
