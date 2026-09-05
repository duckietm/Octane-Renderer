import { IMessageComposer } from '@octane/api';

export class FurniEditorUpdateComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorUpdateComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorUpdateComposer>;

    constructor(id: number, jsonFields: string)
    {
        this._data = [ id, jsonFields ];
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
