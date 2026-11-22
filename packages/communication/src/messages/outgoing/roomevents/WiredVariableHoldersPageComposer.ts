import { IMessageComposer } from '@octane/api';

/**
 * Official AIR 13 `VariableManagementOverviewView` page request:
 * one page of the holders of a single wired variable. The sort comes before the user type, as AIR sends it:
 * sort 0 highest value, 1 lowest value, 2 oldest creation, 3 latest creation, 4 oldest update, 5 latest update;
 * user type -1 all, 1 Habbo, 2 pet, 4 bot.
 */
export class WiredVariableHoldersPageComposer implements IMessageComposer<ConstructorParameters<typeof WiredVariableHoldersPageComposer>>
{
    private _data: ConstructorParameters<typeof WiredVariableHoldersPageComposer>;

    constructor(variableId: string, page: number, pageSize: number, sortTypeFilter: number, userTypeFilter: number)
    {
        this._data = [ variableId, page, pageSize, sortTypeFilter, userTypeFilter ];
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
