import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PrefixReceivedParser } from '../../../parser';

export class PrefixReceivedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PrefixReceivedParser);
    }

    public getParser(): PrefixReceivedParser
    {
        return this.parser as PrefixReceivedParser;
    }
}
