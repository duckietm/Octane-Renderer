import { IMessageComposer } from '@octane/api';

export class ApplyTonerComposer implements IMessageComposer<ConstructorParameters<typeof ApplyTonerComposer>>
{
    private _data: ConstructorParameters<typeof ApplyTonerComposer>;

    constructor(itemId: number, hue: number, saturation: number, lightness: number)
    {
        this._data = [itemId, hue, saturation, lightness];
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
