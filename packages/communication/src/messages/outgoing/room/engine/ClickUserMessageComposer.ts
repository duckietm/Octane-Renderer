import { IMessageComposer } from '@octane/api';

export class ClickUserMessageComposer implements IMessageComposer<ConstructorParameters<typeof ClickUserMessageComposer>>
{
    private _data: ConstructorParameters<typeof ClickUserMessageComposer>;

    constructor(roomUnitId: number)
    {
        this._data = [ roomUnitId ];
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
