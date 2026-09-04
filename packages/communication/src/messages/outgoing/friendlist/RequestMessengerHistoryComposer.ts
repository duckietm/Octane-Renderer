import { IMessageComposer } from '@nitrots/api';

export class RequestMessengerHistoryComposer implements IMessageComposer<[ number, number, number ]>
{
    constructor(private conversationId: number, private beforeMessageId: number, private limit: number = 30)
    {}
    public getMessageArray(): [ number, number, number ]
    {
        return [ this.conversationId, this.beforeMessageId, this.limit ];
    }
    public dispose(): void
    {
        return;
    }
}
