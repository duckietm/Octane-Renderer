import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredOpenParser } from '../../parser';

export class WiredOpenEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredOpenParser);
    }

    public getParser(): WiredOpenParser
    {
        return this.parser as WiredOpenParser;
    }
}
