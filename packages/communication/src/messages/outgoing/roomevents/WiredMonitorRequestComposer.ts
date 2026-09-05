import { IMessageComposer } from '@octane/api';

export class WiredMonitorRequestComposer implements IMessageComposer<ConstructorParameters<typeof WiredMonitorRequestComposer>>
{
    private _data: ConstructorParameters<typeof WiredMonitorRequestComposer>;

    constructor(action: number = 0)
    {
        this._data = [ action ];
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
