import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { HabboClubExtendOfferMessageParser } from '../../parser';

export class HabboClubExtendOfferMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, HabboClubExtendOfferMessageParser);
    }

    public getParser(): HabboClubExtendOfferMessageParser
    {
        return this.parser as HabboClubExtendOfferMessageParser;
    }
}
