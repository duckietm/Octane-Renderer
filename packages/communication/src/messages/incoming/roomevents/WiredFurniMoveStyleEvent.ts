import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredFurniMoveStyleParser } from '../../parser';

export class WiredFurniMoveStyleEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniMoveStyleParser);
    }

    public getParser(): WiredFurniMoveStyleParser
    {
        return this.parser as WiredFurniMoveStyleParser;
    }
}
