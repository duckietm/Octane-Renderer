import { IMessageComposer } from '@octane/api';

export class GetModeratorUserRecordsMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetModeratorUserRecordsMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetModeratorUserRecordsMessageComposer>;

    constructor(userId: number, kind: number)
    {
        this._data = [userId, kind];
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
