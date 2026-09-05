import { IMessageComposer } from '@octane/api';
import { ModBanMessageComposer } from './ModBanMessageComposer';

export class DefaultSanctionMessageComposer implements IMessageComposer<ConstructorParameters<typeof DefaultSanctionMessageComposer>>
{
    private _data: ConstructorParameters<typeof DefaultSanctionMessageComposer>;

    constructor(userId: number, categoryId: number, message: string, issueId: number = -1)
    {
        this._data = [userId, categoryId, message];
        if(issueId != ModBanMessageComposer.NO_ISSUE_ID)
        {
            this._data.push(issueId);
        }
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
