import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { UserNickIconsParser } from '../../../parser';

export class UserNickIconsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, UserNickIconsParser);
    }

    public getParser(): UserNickIconsParser
    {
        return this.parser as UserNickIconsParser;
    }
}
