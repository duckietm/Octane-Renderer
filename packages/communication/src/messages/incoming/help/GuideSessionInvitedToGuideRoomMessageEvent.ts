import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GuideSessionInvitedToGuideRoomMessageParser } from '../../parser';

export class GuideSessionInvitedToGuideRoomMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GuideSessionInvitedToGuideRoomMessageParser);
    }

    public getParser(): GuideSessionInvitedToGuideRoomMessageParser
    {
        return this.parser as GuideSessionInvitedToGuideRoomMessageParser;
    }
}
