import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { InstantMessageErrorParser } from '../../parser';

export class InstantMessageErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, InstantMessageErrorParser);
    }

    public getParser(): InstantMessageErrorParser
    {
        return this.parser as InstantMessageErrorParser;
    }
}
