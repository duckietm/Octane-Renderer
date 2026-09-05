import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PhoneCollectionStateParser } from '../../parser';

export class PhoneCollectionStateMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PhoneCollectionStateParser);
    }

    public getParser(): PhoneCollectionStateParser
    {
        return this.parser as PhoneCollectionStateParser;
    }
}
