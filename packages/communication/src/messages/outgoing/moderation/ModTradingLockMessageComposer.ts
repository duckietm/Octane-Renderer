import { IMessageComposer } from '@octane/api';
import { ModBanMessageComposer } from './ModBanMessageComposer';

export class ModTradingLockMessageComposer implements IMessageComposer<ConstructorParameters<typeof ModTradingLockMessageComposer>>
{
    private _data: ConstructorParameters<typeof ModTradingLockMessageComposer>;

    constructor(userId: number, message: string, lengthInSeconds: number, categoryId: number, issueId: number = -1)
    {
        this._data = [userId, message, lengthInSeconds, categoryId];

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
