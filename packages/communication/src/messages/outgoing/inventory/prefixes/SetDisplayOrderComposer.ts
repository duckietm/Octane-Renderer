import { IMessageComposer } from '@octane/api';

export class SetDisplayOrderComposer implements IMessageComposer<ConstructorParameters<typeof SetDisplayOrderComposer>>
{
    private _data: ConstructorParameters<typeof SetDisplayOrderComposer>;

    constructor(displayOrder: string)
    {
        this._data = [ displayOrder ];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        this._data = null;
    }
}
