import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { FlatControllerAddedParser } from '../../parser';

export class FlatControllerAddedEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, FlatControllerAddedParser);
    }

    public getParser(): FlatControllerAddedParser
    {
        return this.parser as FlatControllerAddedParser;
    }
}
