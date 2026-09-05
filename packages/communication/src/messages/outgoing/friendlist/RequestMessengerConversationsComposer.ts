import { IMessageComposer } from '@octane/api';

export class RequestMessengerConversationsComposer implements IMessageComposer<[]>
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
