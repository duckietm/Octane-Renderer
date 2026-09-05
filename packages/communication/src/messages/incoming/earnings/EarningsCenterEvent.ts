import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { EarningsCenterParser } from '../../parser';

export class EarningsCenterEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, EarningsCenterParser);
    }

    public getParser(): EarningsCenterParser
    {
        return this.parser as EarningsCenterParser;
    }
}
