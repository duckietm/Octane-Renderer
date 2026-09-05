import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { IdentityAccountsParser } from '../../parser';

export class IdentityAccountsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, IdentityAccountsParser);
    }

    public getParser(): IdentityAccountsParser
    {
        return this.parser as IdentityAccountsParser;
    }
}
