import { IMessageComposer } from '@octane/api';

/** Sets one permission for one rank; the server reloads the permissions after it. */
export class HousekeepingSetPermissionComposer implements IMessageComposer<ConstructorParameters<typeof HousekeepingSetPermissionComposer>>
{
    private _data: ConstructorParameters<typeof HousekeepingSetPermissionComposer>;

    constructor(permissionKey: string, rankId: number, value: number)
    {
        this._data = [permissionKey, rankId, value];
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
