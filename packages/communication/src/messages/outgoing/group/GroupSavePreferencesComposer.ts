import { IMessageComposer } from '@octane/api';

export class GroupSavePreferencesComposer implements IMessageComposer<ConstructorParameters<typeof GroupSavePreferencesComposer>>
{
    private _data: ConstructorParameters<typeof GroupSavePreferencesComposer>;

    constructor(groupId: number, state: number, onlyAdminCanDecorate: number, forumEnabled: boolean)
    {
        this._data = [groupId, state, onlyAdminCanDecorate, forumEnabled];
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
