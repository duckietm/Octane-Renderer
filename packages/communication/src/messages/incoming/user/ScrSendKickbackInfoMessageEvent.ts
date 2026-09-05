import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ScrSendKickbackInfoMessageParser } from '../../parser';

export class ScrSendKickbackInfoMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ScrSendKickbackInfoMessageParser);
    }

    public getParser(): ScrSendKickbackInfoMessageParser
    {
        return this.parser as ScrSendKickbackInfoMessageParser;
    }
}
