import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomUnitHandItemParser } from '../../../parser';

export class RoomUnitHandItemEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomUnitHandItemParser);
    }

    public getParser(): RoomUnitHandItemParser
    {
        return this.parser as RoomUnitHandItemParser;
    }
}
