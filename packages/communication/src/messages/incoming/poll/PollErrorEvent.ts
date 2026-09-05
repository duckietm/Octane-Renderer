import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PollErrorParser } from '../../parser';

export class PollErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PollErrorParser);
    }

    public getParser(): PollErrorParser
    {
        return this.parser;
    }
}
