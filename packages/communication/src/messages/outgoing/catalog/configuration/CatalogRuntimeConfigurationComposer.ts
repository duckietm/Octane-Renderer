import { IMessageComposer } from '@octane/api';

export class CatalogRuntimeConfigurationComposer implements IMessageComposer<(number | string)[]>
{
    private _data: (number | string)[];

    constructor(requestId: string)
    {
        this._data = [ 1, requestId ];
    }

    public dispose(): void
    {
        this._data = null;
    }

    public getMessageArray(): (number | string)[]
    {
        return this._data;
    }
}
