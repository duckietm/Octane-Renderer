import { IMessageComposer } from '@octane/api';

export class UpdateForumSettingsMessageComposer implements IMessageComposer<ConstructorParameters<typeof UpdateForumSettingsMessageComposer>>
{
    private _data: ConstructorParameters<typeof UpdateForumSettingsMessageComposer>;

    constructor(groupId: number, readPermissions: number, postMessagePermissions: number, postThreadPermissions: number, moderatePermissions: number)
    {
        this._data = [groupId, readPermissions, postMessagePermissions, postThreadPermissions, moderatePermissions];
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
