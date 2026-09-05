import { IMessageComposer } from '@octane/api';

export class WiredUserVariableUpdateComposer implements IMessageComposer<ConstructorParameters<typeof WiredUserVariableUpdateComposer>>
{
    private _data: ConstructorParameters<typeof WiredUserVariableUpdateComposer>;

    constructor(targetType: number, targetId: number, variableItemId: number, value: number)
    {
        this._data = [ targetType, targetId, variableItemId, value ];
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
