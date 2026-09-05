import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RoomScoreParser } from '../../../parser';

export class RoomScoreEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RoomScoreParser);
    }

    public getParser(): RoomScoreParser
    {
        return this.parser as RoomScoreParser;
    }
}
