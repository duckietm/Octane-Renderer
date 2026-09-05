import { IMessageComposer } from '@octane/api';

export class WiredUserVariableManageComposer implements IMessageComposer<ConstructorParameters<typeof WiredUserVariableManageComposer>>
{
    private _data: ConstructorParameters<typeof WiredUserVariableManageComposer>;

    constructor(action: number, targetType: number, targetId: number, variableItemId: number, value: number)
    {
        this._data = [ action, targetType, targetId, variableItemId, value ];
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
