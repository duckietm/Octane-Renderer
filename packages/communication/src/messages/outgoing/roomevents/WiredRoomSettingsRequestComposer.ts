import { IMessageComposer } from '@octane/api';

export class WiredRoomSettingsRequestComposer implements IMessageComposer<[]>
{
    public getMessageArray(): []
    {
        return [];
    }

    public dispose(): void
    {
        return;
    }
}
