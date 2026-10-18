import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredContractUpdateResultParser } from '../../parser';

export class WiredContractUpdateResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredContractUpdateResultParser);
    }

    public getParser(): WiredContractUpdateResultParser
    {
        return this.parser as WiredContractUpdateResultParser;
    }
}
