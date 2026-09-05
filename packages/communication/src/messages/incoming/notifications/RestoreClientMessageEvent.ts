import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { RestoreClientMessageParser } from '../../parser';

export class RestoreClientMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, RestoreClientMessageParser);
    }

    public getParser(): RestoreClientMessageParser
    {
        return this.parser;
    }
}
