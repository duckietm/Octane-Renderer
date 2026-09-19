import { IMessageComposer } from '@octane/api';

export interface RewardTrackTaskLevelInput
{
    requiredCount: number;
    pointsReward: number;
    premium: boolean;
}

/** Creates or updates a reward track task; the levels sent replace the stored ones. */
export class SaveRewardTrackTaskMessageComposer implements IMessageComposer<(string | number | boolean)[]>
{
    private _data: (string | number | boolean)[];

    constructor(trackId: string, id: string, actionType: string, parameter: string, premium: boolean, sortOrder: number, levels: RewardTrackTaskLevelInput[])
    {
        this._data = [trackId, id, actionType, parameter, premium, sortOrder, levels.length];

        for(const level of levels) this._data.push(level.requiredCount, level.pointsReward, level.premium);
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
