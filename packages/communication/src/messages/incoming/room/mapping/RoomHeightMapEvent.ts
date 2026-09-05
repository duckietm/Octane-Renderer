import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomHeightMapParser } from '../../../parser';

export class RoomHeightMapEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomHeightMapParser);
    }

    public getParser(): RoomHeightMapParser
    {
        return this.parser as RoomHeightMapParser;
    }
}
