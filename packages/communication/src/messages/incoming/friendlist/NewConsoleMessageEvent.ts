import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NewConsoleMessageParser } from '../../parser';

export class NewConsoleMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NewConsoleMessageParser);
    }

    public getParser(): NewConsoleMessageParser
    {
        return this.parser as NewConsoleMessageParser;
    }
}
