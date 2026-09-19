import { IMessageComposer } from '@octane/api';

/** Deletes a reward track, one of its tasks or one of its prizes; the id is empty for a track. */
export class DeleteRewardTrackEntityMessageComposer implements IMessageComposer<ConstructorParameters<typeof DeleteRewardTrackEntityMessageComposer>>
{
    private _data: ConstructorParameters<typeof DeleteRewardTrackEntityMessageComposer>;

    constructor(entity: string, trackId: string, id: string)
    {
        this._data = [entity, trackId, id];
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
