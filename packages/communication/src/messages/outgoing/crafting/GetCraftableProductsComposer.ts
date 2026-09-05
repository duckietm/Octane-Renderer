import { IMessageComposer } from '@octane/api';

export class GetCraftableProductsComposer implements IMessageComposer<ConstructorParameters<typeof GetCraftableProductsComposer>>
{
    private _data: ConstructorParameters<typeof GetCraftableProductsComposer>;

    constructor(objectId: number)
    {
        this._data = [objectId];
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
