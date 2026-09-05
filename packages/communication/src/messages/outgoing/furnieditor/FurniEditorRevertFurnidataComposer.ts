import { IMessageComposer } from '@octane/api';

export class FurniEditorRevertFurnidataComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorRevertFurnidataComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorRevertFurnidataComposer>;

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
