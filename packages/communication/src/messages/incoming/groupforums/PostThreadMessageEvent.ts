import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { PostThreadMessageParser } from '../../parser';

export class PostThreadMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, PostThreadMessageParser);
    }

    public getParser(): PostThreadMessageParser
    {
        return this.parser as PostThreadMessageParser;
    }
}
