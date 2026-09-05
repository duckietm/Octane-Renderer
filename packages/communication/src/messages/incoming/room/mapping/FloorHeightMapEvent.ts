import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FloorHeightMapMessageParser } from '../../../parser';

export class FloorHeightMapEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FloorHeightMapMessageParser);
    }

    public getParser(): FloorHeightMapMessageParser
    {
        return this.parser as FloorHeightMapMessageParser;
    }
}
