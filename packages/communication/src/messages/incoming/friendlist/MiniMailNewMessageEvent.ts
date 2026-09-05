import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { MiniMailNewMessageParser } from '../../parser';

export class MiniMailNewMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, MiniMailNewMessageParser);
    }

    public getParser(): MiniMailNewMessageParser
    {
        return this.parser;
    }
}
