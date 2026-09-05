import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CantConnectMessageParser } from '../../../parser';

export class RoomEnterErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CantConnectMessageParser);
    }

    public getParser(): CantConnectMessageParser
    {
        return this.parser as CantConnectMessageParser;
    }
}
