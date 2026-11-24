import { IMessageComposer } from '@octane/api';

/**
 * Official AIR `VariableManagementDetailView` request (2035): the permanent variables of one holder,
 * answered by `WiredUserPermanentVariablesListEvent`. The holder need not be in the room.
 */
export class WiredPermanentVariablesRequestComposer implements IMessageComposer<ConstructorParameters<typeof WiredPermanentVariablesRequestComposer>>
{
    private _data: ConstructorParameters<typeof WiredPermanentVariablesRequestComposer>;

    constructor(entityType: number, entityId: number)
    {
        this._data = [ entityType, entityId ];
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
