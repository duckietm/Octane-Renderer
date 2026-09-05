import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NavigatorCollapsedParser } from '../../parser';

export class NavigatorCollapsedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NavigatorCollapsedParser);
    }

    public getParser(): NavigatorCollapsedParser
    {
        return this.parser as NavigatorCollapsedParser;
    }
}
