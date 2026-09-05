import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { IgnoreResultParser } from '../../parser';

export class IgnoreResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, IgnoreResultParser);
    }

    public getParser(): IgnoreResultParser
    {
        return this.parser as IgnoreResultParser;
    }
}
