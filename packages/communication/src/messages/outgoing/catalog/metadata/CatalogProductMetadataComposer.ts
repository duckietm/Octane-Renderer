import { IMessageComposer } from '@octane/api';

export class CatalogProductMetadataComposer implements IMessageComposer<(number | string)[]>
{
    private _data: (number | string)[];

    constructor(requestId: string, pageId: number, catalogMode: string)
    {
        this._data = [ 1, requestId, pageId, catalogMode ];
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
