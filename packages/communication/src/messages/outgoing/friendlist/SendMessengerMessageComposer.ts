import { IMessageComposer } from '@octane/api';

export class SendMessengerMessageComposer implements IMessageComposer<[ number, number, number, number, string, string ]>
{
    constructor(private conversationId: number, private recipientId: number, private confirmationId: number, private type: number, private message: string, private metadata: string = '')
    {}
    public getMessageArray(): [ number, number, number, number, string, string ]
    {
        return [ this.conversationId, this.recipientId, this.confirmationId, this.type, this.message, this.metadata ];
    }
    public dispose(): void
    {
        return;
    }
}
