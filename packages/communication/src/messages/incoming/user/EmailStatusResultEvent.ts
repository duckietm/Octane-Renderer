import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { EmailStatusParser } from '../../parser';

export class EmailStatusResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, EmailStatusParser);
    }

    public getParser(): EmailStatusParser
    {
        return this.parser as EmailStatusParser;
    }
}
