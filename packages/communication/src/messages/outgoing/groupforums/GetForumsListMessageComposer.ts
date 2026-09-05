import { IMessageComposer } from '@octane/api';

export class GetForumsListMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetForumsListMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetForumsListMessageComposer>;

    constructor(listCode: number, startIndex: number, amount: number)
    {
        this._data = [listCode, startIndex, amount];
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
