import { IMessageComposer } from '@octane/api';

export class UserSettingsPrivacyComposer implements IMessageComposer<ConstructorParameters<typeof UserSettingsPrivacyComposer>>
{
    private _data: ConstructorParameters<typeof UserSettingsPrivacyComposer>;

    constructor(onlineStatusVisible: boolean, friendsCanFollow: boolean, friendRequestsAllowed: boolean)
    {
        this._data = [ onlineStatusVisible, friendsCanFollow, friendRequestsAllowed ];
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
