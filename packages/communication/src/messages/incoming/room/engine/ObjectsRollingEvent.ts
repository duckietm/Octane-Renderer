import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { ObjectsRollingParser } from '../../../parser';

export class ObjectsRollingEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, ObjectsRollingParser);
    }

    public getParser(): ObjectsRollingParser
    {
        return this.parser as ObjectsRollingParser;
    }
}
