import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { EarningsClaimResultParser } from '../../parser';

export class EarningsClaimResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, EarningsClaimResultParser);
    }

    public getParser(): EarningsClaimResultParser
    {
        return this.parser as EarningsClaimResultParser;
    }
}
