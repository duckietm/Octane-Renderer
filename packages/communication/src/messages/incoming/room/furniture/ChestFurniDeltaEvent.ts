import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ChestFurniDeltaMessageParser } from '../../../parser';

export class ChestFurniDeltaEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ChestFurniDeltaMessageParser);
    }

    public getParser(): ChestFurniDeltaMessageParser
    {
        return this.parser as ChestFurniDeltaMessageParser;
    }
}
