import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredFurniRuntimeStateParser } from '../../parser';

export class WiredFurniRuntimeStateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredFurniRuntimeStateParser);
    }

    public getParser(): WiredFurniRuntimeStateParser
    {
        return this.parser as WiredFurniRuntimeStateParser;
    }
}
