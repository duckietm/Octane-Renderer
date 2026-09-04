import { IMessageComposer } from '@nitrots/api';

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
