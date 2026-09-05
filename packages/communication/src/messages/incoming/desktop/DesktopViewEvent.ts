import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { DesktopViewParser } from '../../parser';

export class DesktopViewEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, DesktopViewParser);
    }

    public getParser(): DesktopViewParser
    {
        return this.parser;
    }
}
