import { IMessageComposer } from '@octane/api';

export class FurniEditorBySpriteComposer implements IMessageComposer<ConstructorParameters<typeof FurniEditorBySpriteComposer>>
{
    private _data: ConstructorParameters<typeof FurniEditorBySpriteComposer>;

    constructor(spriteId: number)
    {
        this._data = [ spriteId ];
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
