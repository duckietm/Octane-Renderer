import { IMessageComposer } from '@octane/api';

export class FurniEditorSearchComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorSearchComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorSearchComposer>;

    constructor(query: string, type: string, page: number, sortField: string = 'id', sortDir: string = 'asc')
    {
        this._data = [ query, type, page, sortField, sortDir ];
    }

    dispose(): void
    {
        this._data = null;
    }

    public getMessageArray()
    {
        return this._data;
    }
}
