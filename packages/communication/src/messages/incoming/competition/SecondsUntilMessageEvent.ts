import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { SecondsUntilMessageParser } from '../../parser';

export class SecondsUntilMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, SecondsUntilMessageParser);
    }

    public getParser(): SecondsUntilMessageParser
    {
        return this.parser as SecondsUntilMessageParser;
    }
}
