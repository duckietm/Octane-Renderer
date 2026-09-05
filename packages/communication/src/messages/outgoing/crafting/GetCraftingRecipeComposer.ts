import { IMessageComposer } from '@octane/api';

export class GetCraftingRecipeComposer implements IMessageComposer<ConstructorParameters<typeof GetCraftingRecipeComposer>>
{
    private _data: ConstructorParameters<typeof GetCraftingRecipeComposer>;

    constructor(recipeName: string)
    {
        this._data = [recipeName];
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
