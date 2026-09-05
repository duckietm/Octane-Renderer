import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { AreaHideMessageParser } from '../../../parser';

export class AreaHideMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, AreaHideMessageParser);
    }

    public getParser(): AreaHideMessageParser
    {
        return this.parser as AreaHideMessageParser;
    }
}
