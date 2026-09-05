import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { GuideSessionRequesterRoomMessageParser } from '../../parser';

export class GuideSessionRequesterRoomMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, GuideSessionRequesterRoomMessageParser);
    }

    public getParser(): GuideSessionRequesterRoomMessageParser
    {
        return this.parser as GuideSessionRequesterRoomMessageParser;
    }
}
