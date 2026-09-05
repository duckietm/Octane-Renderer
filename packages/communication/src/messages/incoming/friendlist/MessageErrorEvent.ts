import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MessageErrorParser } from '../../parser';

export class MessageErrorEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MessageErrorParser);
    }

    public getParser(): MessageErrorParser
    {
        return this.parser as MessageErrorParser;
    }
}
