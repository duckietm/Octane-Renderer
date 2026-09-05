import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { BadgePointLimitsParser } from '../../../parser';

export class BadgePointLimitsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, BadgePointLimitsParser);
    }

    public getParser(): BadgePointLimitsParser
    {
        return this.parser as BadgePointLimitsParser;
    }
}
