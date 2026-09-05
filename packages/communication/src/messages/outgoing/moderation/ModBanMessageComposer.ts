import { IMessageComposer } from '@octane/api';

export class ModBanMessageComposer implements IMessageComposer<ConstructorParameters<typeof ModBanMessageComposer>>
{
    public static readonly NO_ISSUE_ID = -1;

    private _data: ConstructorParameters<typeof ModBanMessageComposer>;

    constructor(userId: number, message: string, categoryId: number, banType: number, permanentBan: boolean, issueId: number = -1)
    {
        this._data = [userId, message, categoryId, banType, permanentBan];
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
