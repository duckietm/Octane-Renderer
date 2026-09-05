import { IMessageComposer } from '@octane/api';

export class FurniEditorImportTextComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorImportTextComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorImportTextComposer>;

    constructor(itemId: number)
    {
        this._data = [ itemId ];
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
