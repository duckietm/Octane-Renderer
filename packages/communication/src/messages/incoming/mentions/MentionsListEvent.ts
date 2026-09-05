import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MentionsListParser } from '../../parser';

export class MentionsListEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MentionsListParser);
    }

    public getParser(): MentionsListParser
    {
        return this.parser as MentionsListParser;
    }
}
