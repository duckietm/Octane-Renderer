import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CampaignCalendarDoorOpenedMessageParser } from '../../parser';

export class CampaignCalendarDoorOpenedMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CampaignCalendarDoorOpenedMessageParser);
    }

    public getParser(): CampaignCalendarDoorOpenedMessageParser
    {
        return this.parser as CampaignCalendarDoorOpenedMessageParser;
    }
}
