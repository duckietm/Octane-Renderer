import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomRightsOwnerParser } from '../../../../parser';

export class RoomRightsOwnerEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomRightsOwnerParser);
    }

    public getParser(): RoomRightsOwnerParser
    {
        return this.parser;
    }
}
