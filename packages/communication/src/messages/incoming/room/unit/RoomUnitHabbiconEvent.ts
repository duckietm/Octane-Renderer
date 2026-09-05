import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomUnitHabbiconParser } from '../../../parser';

export class RoomUnitHabbiconEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomUnitHabbiconParser);
    }

    public getParser(): RoomUnitHabbiconParser
    {
        return this.parser as RoomUnitHabbiconParser;
    }
}
