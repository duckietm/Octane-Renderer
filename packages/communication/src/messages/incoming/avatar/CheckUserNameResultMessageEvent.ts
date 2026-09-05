import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { CheckUserNameResultMessageParser } from '../../parser';

export class CheckUserNameResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, CheckUserNameResultMessageParser);
    }

    public getParser(): CheckUserNameResultMessageParser
    {
        return this.parser as CheckUserNameResultMessageParser;
    }
}
