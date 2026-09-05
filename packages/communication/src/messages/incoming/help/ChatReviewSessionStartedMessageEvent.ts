import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChatReviewSessionStartedMessageParser } from '../../parser';

export class ChatReviewSessionStartedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChatReviewSessionStartedMessageParser);
    }

    public getParser(): ChatReviewSessionStartedMessageParser
    {
        return this.parser as ChatReviewSessionStartedMessageParser;
    }
}
