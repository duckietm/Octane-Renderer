import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ObjectsDataUpdateParser } from '../../../parser';

export class ObjectsDataUpdateEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ObjectsDataUpdateParser);
    }

    public getParser(): ObjectsDataUpdateParser
    {
        return this.parser as ObjectsDataUpdateParser;
    }
}
