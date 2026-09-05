import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BundleDiscountRulesetMessageParser } from '../../parser';

export class BundleDiscountRulesetMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BundleDiscountRulesetMessageParser);
    }

    public getParser(): BundleDiscountRulesetMessageParser
    {
        return this.parser as BundleDiscountRulesetMessageParser;
    }
}
