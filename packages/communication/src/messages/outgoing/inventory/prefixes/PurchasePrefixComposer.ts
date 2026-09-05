import { IMessageComposer } from '@octane/api';

export class PurchasePrefixComposer implements IMessageComposer<ConstructorParameters<typeof PurchasePrefixComposer>>
{
    private _data: ConstructorParameters<typeof PurchasePrefixComposer>;

    constructor(text: string, color: string, icon: string = '', effect: string = '', font: string = '')
    {
        this._data = [ text, color, icon, effect, font ];
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
