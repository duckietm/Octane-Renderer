import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CompetitionStatusMessageParser } from '../../parser';

export class CompetitionStatusMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CompetitionStatusMessageParser);
    }

    public getParser(): CompetitionStatusMessageParser
    {
        return this.parser as CompetitionStatusMessageParser;
    }
}
