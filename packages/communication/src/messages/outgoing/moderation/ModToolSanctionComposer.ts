import { IMessageComposer } from '@octane/api';

export class ModToolSanctionComposer implements IMessageComposer<ConstructorParameters<typeof ModToolSanctionComposer>>
{
    private _data: ConstructorParameters<typeof ModToolSanctionComposer>;

    constructor(userId: number, sanctionLevelId: number, categoryId: number)
    {
        this._data = [userId, sanctionLevelId, categoryId];
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
