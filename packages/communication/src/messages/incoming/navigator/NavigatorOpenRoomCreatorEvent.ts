import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NavigatorOpenRoomCreatorParser } from '../../parser';

export class NavigatorOpenRoomCreatorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NavigatorOpenRoomCreatorParser);
    }

    public getParser(): NavigatorOpenRoomCreatorParser
    {
        return this.parser;
    }
}
