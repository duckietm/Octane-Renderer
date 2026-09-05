import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { MessengerConversationData } from './MessengerData';

export class MessengerConversationsParser implements IMessageParser
{
    private _conversations: MessengerConversationData[] = [];
    public flush(): boolean
    {
        this._conversations = []; return true;
    }
    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;
        const count = wrapper.readInt();
        if(count < 0 || count > 500) return false;
        for(let i = 0; i < count; i++) this._conversations.push({ id: wrapper.readInt(), type: wrapper.readInt(), participantId: wrapper.readInt(), name: wrapper.readString(), lastMessageId: wrapper.readInt(), unreadCount: wrapper.readInt(), updatedAt: wrapper.readInt() });
        return true;
    }
    public get conversations()
    {
        return this._conversations;
    }
}
