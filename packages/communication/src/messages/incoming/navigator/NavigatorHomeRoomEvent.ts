import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NavigatorHomeRoomParser } from '../../parser';

export class NavigatorHomeRoomEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NavigatorHomeRoomParser);
    }

    public getParser(): NavigatorHomeRoomParser
    {
        return this.parser as NavigatorHomeRoomParser;
    }
}
