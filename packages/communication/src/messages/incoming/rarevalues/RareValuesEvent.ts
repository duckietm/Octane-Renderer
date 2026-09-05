import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RareValuesParser } from '../../parser';

export class RareValuesEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RareValuesParser);
    }

    public getParser(): RareValuesParser
    {
        return this.parser as RareValuesParser;
    }
}
