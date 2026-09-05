import { IMessageComposer } from '@octane/api';

export class FurniEditorInteractionsComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorInteractionsComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorInteractionsComposer>;

    constructor()
    {
        this._data = [];
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
