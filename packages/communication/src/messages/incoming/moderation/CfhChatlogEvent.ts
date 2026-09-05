import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CfhChatlogMessageParser } from '../../parser';

export class CfhChatlogEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CfhChatlogMessageParser);
    }

    public getParser(): CfhChatlogMessageParser
    {
        return this.parser as CfhChatlogMessageParser;
    }
}
