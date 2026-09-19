import { IMessageComposer } from '@octane/api';

/** Creates or updates a reward track. The premium boost travels in hundredths: 150 is 1.5x. */
export class SaveRewardTrackMessageComposer implements IMessageComposer<ConstructorParameters<typeof SaveRewardTrackMessageComposer>>
{
    private _data: ConstructorParameters<typeof SaveRewardTrackMessageComposer>;

    constructor(id: string, theme: string, sortOrder: number, startsAt: number, endsAt: number, hasPremium: boolean, premiumBoostPercent: number, premiumInstantPoints: number, premiumCostDiamonds: number, premiumCostCredits: number, enabled: boolean)
    {
        this._data = [id, theme, sortOrder, startsAt, endsAt, hasPremium, premiumBoostPercent, premiumInstantPoints, premiumCostDiamonds, premiumCostCredits, enabled];
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
