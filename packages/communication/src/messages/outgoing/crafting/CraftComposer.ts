import { IMessageComposer } from '@octane/api';

export class CraftComposer implements IMessageComposer<ConstructorParameters<typeof CraftComposer>>
{
    private _data: ConstructorParameters<typeof CraftComposer>;

    constructor(objectId: number, recipeName: string)
    {
        this._data = [objectId, recipeName];
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
