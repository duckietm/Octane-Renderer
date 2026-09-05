import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BadgesParser } from '../../../parser';

export class BadgesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BadgesParser);
    }

    public getParser(): BadgesParser
    {
        return this.parser as BadgesParser;
    }
}
