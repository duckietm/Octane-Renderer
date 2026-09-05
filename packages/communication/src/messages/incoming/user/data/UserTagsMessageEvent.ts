import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserTagsParser } from '../../../parser';

export class UserTagsMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserTagsParser);
    }

    public getParser(): UserTagsParser
    {
        return this.parser as UserTagsParser;
    }
}
