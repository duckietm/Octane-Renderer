import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GuideSessionPartnerIsTypingMessageParser } from '../../parser';

export class GuideSessionPartnerIsTypingMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GuideSessionPartnerIsTypingMessageParser);
    }

    public getParser(): GuideSessionPartnerIsTypingMessageParser
    {
        return this.parser as GuideSessionPartnerIsTypingMessageParser;
    }
}
