import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UpdateMessageMessageParser } from '../../parser';

export class UpdateMessageMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UpdateMessageMessageParser);
    }

    public getParser(): UpdateMessageMessageParser
    {
        return this.parser as UpdateMessageMessageParser;
    }
}
