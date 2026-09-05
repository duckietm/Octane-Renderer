import { IMessageComposer } from '@octane/api';

export class WiredUserInspectMoveComposer implements IMessageComposer<ConstructorParameters<typeof WiredUserInspectMoveComposer>>
{
    private _data: ConstructorParameters<typeof WiredUserInspectMoveComposer>;

    constructor(roomUnitId: number, x: number, y: number, direction: number)
    {
        this._data = [ roomUnitId, x, y, direction ];
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
