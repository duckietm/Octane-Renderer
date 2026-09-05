import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { VoucherRedeemOkMessageParser } from '../../parser';

export class VoucherRedeemOkMessageEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, VoucherRedeemOkMessageParser);
    }

    public getParser(): VoucherRedeemOkMessageParser
    {
        return this.parser as VoucherRedeemOkMessageParser;
    }
}
