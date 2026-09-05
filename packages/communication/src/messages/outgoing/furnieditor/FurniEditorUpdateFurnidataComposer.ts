import { IMessageComposer } from '@octane/api';

export class FurniEditorUpdateFurnidataComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorUpdateFurnidataComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorUpdateFurnidataComposer>;

    constructor(itemId: number, jsonFields: string)
    {
        this._data = [ itemId, jsonFields ];
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
