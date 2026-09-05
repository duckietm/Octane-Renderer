import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { TryVerificationCodeResultParser } from '../../parser';

export class TryVerificationCodeResultMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, TryVerificationCodeResultParser);
    }

    public getParser(): TryVerificationCodeResultParser
    {
        return this.parser as TryVerificationCodeResultParser;
    }
}
