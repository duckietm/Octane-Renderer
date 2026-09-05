import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { VoucherRedeemErrorMessageParser } from '../../parser';

export class VoucherRedeemErrorMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, VoucherRedeemErrorMessageParser);
    }

    public getParser(): VoucherRedeemErrorMessageParser
    {
        return this.parser as VoucherRedeemErrorMessageParser;
    }
}
