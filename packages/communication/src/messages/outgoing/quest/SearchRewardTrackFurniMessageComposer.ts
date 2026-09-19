import { IMessageComposer } from '@octane/api';

/** Looks up furni by name for a reward track prize (staff editor, needs acc_rewardtrack). */
export class SearchRewardTrackFurniMessageComposer implements IMessageComposer<ConstructorParameters<typeof SearchRewardTrackFurniMessageComposer>>
{
    private _data: ConstructorParameters<typeof SearchRewardTrackFurniMessageComposer>;

    constructor(query: string)
    {
        this._data = [query];
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
