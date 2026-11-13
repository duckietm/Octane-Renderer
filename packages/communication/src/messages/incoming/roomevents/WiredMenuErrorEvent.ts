import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredMenuErrorParser } from '../../parser';

export class WiredMenuErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredMenuErrorParser);
    }

    public getParser(): WiredMenuErrorParser
    {
        return this.parser as WiredMenuErrorParser;
    }
}
