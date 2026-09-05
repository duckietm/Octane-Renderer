import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomEnterParser } from '../../../parser';

export class RoomEnterEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomEnterParser);
    }

    public getParser(): RoomEnterParser
    {
        return this.parser;
    }
}
