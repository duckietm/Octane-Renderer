import { IMessageComposer } from '@octane/api';

export class CraftSecretComposer implements IMessageComposer<number[]>
{
    private _data: number[];

    constructor(objectId: number, ingredients: number[])
    {
        this._data = [objectId, ingredients.length].concat(ingredients);
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
