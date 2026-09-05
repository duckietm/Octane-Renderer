import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HabboSearchResultParser } from '../../parser';

export class HabboSearchResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HabboSearchResultParser);
    }

    public getParser(): HabboSearchResultParser
    {
        return this.parser as HabboSearchResultParser;
    }
}
