import { IMessageComposer } from '@octane/api';

/**
 * Official AIR `VariableManagementDetailView` change (627) of one permanent variable of a holder:
 * action 0 sets the value, 1 gives the holder the variable, 2 takes it away.
 */
export class WiredPermanentVariableSetComposer implements IMessageComposer<ConstructorParameters<typeof WiredPermanentVariableSetComposer>>
{
    private _data: ConstructorParameters<typeof WiredPermanentVariableSetComposer>;

    constructor(entityType: number, entityId: number, variableId: string, value: number, action: number)
    {
        this._data = [ entityType, entityId, variableId, value, action ];
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

export const WIRED_PERMANENT_VARIABLE_ACTION_SET = 0;
export const WIRED_PERMANENT_VARIABLE_ACTION_CREATE = 1;
export const WIRED_PERMANENT_VARIABLE_ACTION_DELETE = 2;
