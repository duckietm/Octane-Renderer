import { IMessageComposer } from '@octane/api';

export class SnowWarRequestFullGameStatusComposer implements IMessageComposer<[]>
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
