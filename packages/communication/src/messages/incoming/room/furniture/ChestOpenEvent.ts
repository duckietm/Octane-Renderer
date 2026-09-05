import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChestOpenMessageParser } from '../../../parser';

export class ChestOpenEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestOpenMessageParser);
    }

    public getParser(): ChestOpenMessageParser
    {
        return this.parser as ChestOpenMessageParser;
    }
}
