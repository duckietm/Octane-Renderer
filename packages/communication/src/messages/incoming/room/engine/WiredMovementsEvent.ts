import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredMovementsParser } from '../../../parser';

export class WiredMovementsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredMovementsParser);
    }

    public getParser(): WiredMovementsParser
    {
        return this.parser as WiredMovementsParser;
    }
}
