import { IMessageComposer } from '@octane/api';
import { ModBanMessageComposer } from './ModBanMessageComposer';

export class ModAlertMessageComposer implements IMessageComposer<ConstructorParameters<typeof ModAlertMessageComposer>>
{
    private _data: ConstructorParameters<typeof ModAlertMessageComposer>;

    constructor(userId: number, message: string, categoryId: number, issueId: number = -1)
    {
        this._data = [userId, message, categoryId];
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
