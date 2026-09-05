import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GuideSessionDetachedMessageParser } from '../../parser';

export class GuideSessionDetachedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GuideSessionDetachedMessageParser);
    }

    public getParser(): GuideSessionDetachedMessageParser
    {
        return this.parser;
    }
}
