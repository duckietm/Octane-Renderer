import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TargetedOfferNotFoundParser } from '../../parser';

export class TargetedOfferNotFoundEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TargetedOfferNotFoundParser);
    }

    public getParser(): TargetedOfferNotFoundParser
    {
        return this.parser;
    }
}
