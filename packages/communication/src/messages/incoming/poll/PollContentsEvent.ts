import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PollContentsParser } from '../../parser';

export class PollContentsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PollContentsParser);
    }

    public getParser(): PollContentsParser
    {
        return this.parser as PollContentsParser;
    }
}
