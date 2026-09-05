import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { InClientLinkParser } from '../../parser';

export class InClientLinkEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, InClientLinkParser);
    }

    public getParser(): InClientLinkParser
    {
        return this.parser as InClientLinkParser;
    }
}
