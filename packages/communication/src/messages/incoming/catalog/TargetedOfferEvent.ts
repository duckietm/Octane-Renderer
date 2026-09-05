import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TargetedOfferParser } from '../../parser';

export class TargetedOfferEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TargetedOfferParser);
    }

    public getParser(): TargetedOfferParser
    {
        return this.parser as TargetedOfferParser;
    }
}
