import { IMessageComposer } from '@octane/api';

export class ModToolPreferencesComposer implements IMessageComposer<ConstructorParameters<typeof ModToolPreferencesComposer>>
{
    private _data: ConstructorParameters<typeof ModToolPreferencesComposer>;

    constructor(positionX: number, positionY: number, width: number, height: number)
    {
        this._data = [positionX, positionY, width, height];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
