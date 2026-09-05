import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CampaignCalendarDataMessageParser } from '../../parser';

export class CampaignCalendarDataMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CampaignCalendarDataMessageParser);
    }

    public getParser(): CampaignCalendarDataMessageParser
    {
        return this.parser as CampaignCalendarDataMessageParser;
    }
}
