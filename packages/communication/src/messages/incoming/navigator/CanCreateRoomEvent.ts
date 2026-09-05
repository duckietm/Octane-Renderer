import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CanCreateRoomMessageParser } from '../../parser';

export class CanCreateRoomEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CanCreateRoomMessageParser);
    }

    public getParser(): CanCreateRoomMessageParser
    {
        return this.parser as CanCreateRoomMessageParser;
    }
}
