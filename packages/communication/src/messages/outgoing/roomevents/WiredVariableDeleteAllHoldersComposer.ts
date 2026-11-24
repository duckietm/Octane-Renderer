import { IMessageComposer } from '@octane/api';

/** Official AIR `WiredMenuOverviewTab` "delete from all holders" (2480): takes the variable from every holder. */
export class WiredVariableDeleteAllHoldersComposer implements IMessageComposer<ConstructorParameters<typeof WiredVariableDeleteAllHoldersComposer>>
{
    private _data: ConstructorParameters<typeof WiredVariableDeleteAllHoldersComposer>;

    constructor(variableId: string)
    {
        this._data = [ variableId ];
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
