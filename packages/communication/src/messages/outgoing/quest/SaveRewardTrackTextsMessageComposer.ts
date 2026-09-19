import { IMessageComposer } from '@octane/api';

export interface RewardTrackTextInput
{
    key: string;
    value: string;
}

/** Replaces the localization texts of a track: the keys are the part after "reward_track.<track>.". */
export class SaveRewardTrackTextsMessageComposer implements IMessageComposer<(string | number)[]>
{
    private _data: (string | number)[];

    constructor(trackId: string, texts: RewardTrackTextInput[])
    {
        this._data = [trackId, texts.length];

        for(const text of texts) this._data.push(text.key, text.value);
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
