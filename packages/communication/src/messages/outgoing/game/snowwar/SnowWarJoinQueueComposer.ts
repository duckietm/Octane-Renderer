import { IMessageComposer } from '@nitrots/api';

export class SnowWarJoinQueueComposer implements IMessageComposer<[]>
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
