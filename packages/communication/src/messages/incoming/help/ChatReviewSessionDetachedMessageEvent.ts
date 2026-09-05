import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChatReviewSessionDetachedMessageParser } from '../../parser';

export class ChatReviewSessionDetachedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChatReviewSessionDetachedMessageParser);
    }

    public getParser(): ChatReviewSessionDetachedMessageParser
    {
        return this.parser;
    }
}
