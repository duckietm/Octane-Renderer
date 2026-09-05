import { IMessageComposer } from '@octane/api';

export class FurniEditorDeleteComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorDeleteComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorDeleteComposer>;

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
