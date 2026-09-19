import { IMessageComposer } from '@octane/api';

/** Asks for every stored reward track, disabled ones included (staff editor, needs acc_rewardtrack). */
export class GetRewardTrackAdminDataMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetRewardTrackAdminDataMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetRewardTrackAdminDataMessageComposer>;

    constructor()
    {
        this._data = [];
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
