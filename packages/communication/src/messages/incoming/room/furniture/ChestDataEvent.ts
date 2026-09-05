import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChestDataMessageParser } from '../../../parser';

export class ChestDataEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestDataMessageParser);
    }

    public getParser(): ChestDataMessageParser
    {
        return this.parser as ChestDataMessageParser;
    }
}
