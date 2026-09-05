import { IMessageComposer } from '@octane/api';

export class SoundboardCatalogRequestComposer implements IMessageComposer<[]>
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
