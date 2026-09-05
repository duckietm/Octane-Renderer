import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomRightsParser } from '../../../../parser';

export class RoomRightsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomRightsParser);
    }

    public getParser(): RoomRightsParser
    {
        return this.parser as RoomRightsParser;
    }
}
