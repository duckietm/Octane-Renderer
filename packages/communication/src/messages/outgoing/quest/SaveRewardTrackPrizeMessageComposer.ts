import { IMessageComposer } from '@octane/api';

/** Creates or updates a reward track prize. */
export class SaveRewardTrackPrizeMessageComposer implements IMessageComposer<ConstructorParameters<typeof SaveRewardTrackPrizeMessageComposer>>
{
    private _data: ConstructorParameters<typeof SaveRewardTrackPrizeMessageComposer>;

    constructor(trackId: string, id: string, requiredPoints: number, productItemTypeId: number, rewardType: string, extraParams: string, rewardAmount: number, premium: boolean, sortOrder: number)
    {
        this._data = [trackId, id, requiredPoints, productItemTypeId, rewardType, extraParams, rewardAmount, premium, sortOrder];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
