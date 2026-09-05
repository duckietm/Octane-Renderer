import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomRightsClearParser } from '../../../../parser';

export class RoomRightsClearEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomRightsClearParser);
    }

    public getParser(): RoomRightsClearParser
    {
        return this.parser;
    }
}
