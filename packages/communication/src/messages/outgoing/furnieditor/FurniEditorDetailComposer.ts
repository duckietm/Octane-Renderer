import { IMessageComposer } from '@octane/api';

export class FurniEditorDetailComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorDetailComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorDetailComposer>;

    constructor(id: number)
    {
        this._data = [ id ];
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
