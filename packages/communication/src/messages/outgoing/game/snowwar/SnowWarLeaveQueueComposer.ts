import { IMessageComposer } from '@octane/api';

export class SnowWarLeaveQueueComposer implements IMessageComposer<[]>
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
