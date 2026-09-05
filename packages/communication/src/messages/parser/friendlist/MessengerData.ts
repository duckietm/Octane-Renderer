import { IMessageDataWrapper } from '@octane/api';

export interface MessengerConversationData { id: number; type: number; participantId: number; name: string; lastMessageId: number; unreadCount: number; updatedAt: number; }
export interface MessengerMessageData { id: number; conversationId: number; senderId: number; type: number; message: string; metadata: string; createdAt: number; }

export const parseMessengerMessage = (wrapper: IMessageDataWrapper, conversationId: number): MessengerMessageData => ({
    id: wrapper.readInt(), conversationId, senderId: wrapper.readInt(), type: wrapper.readInt(),
    message: wrapper.readString(), metadata: wrapper.readString(), createdAt: wrapper.readInt()
});
