import { IMessageComposer } from '@octane/api';
import { ModBanMessageComposer } from './ModBanMessageComposer';

export class ModMessageMessageComposer implements IMessageComposer<any>
{
    private _data: any[] = [];

    constructor(userId: number, message: string, categoryId: number, issueId: number = -1)
    {
        this._data.push(userId);
        this._data.push(message);
        this._data.push('');
        this._data.push('');
        this._data.push(categoryId);
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
