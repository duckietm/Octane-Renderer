import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredFurniOpacityParser } from '../../parser';

export class WiredFurniOpacityEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniOpacityParser);
    }

    public getParser(): WiredFurniOpacityParser
    {
        return this.parser as WiredFurniOpacityParser;
    }
}
