import { IMessageComposer } from '@octane/api';

export class SoundboardRequestSettingsComposer implements IMessageComposer<[]>
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
