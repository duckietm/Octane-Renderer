import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredContractOpenParser } from '../../parser';

export class WiredContractOpenEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredContractOpenParser);
    }

    public getParser(): WiredContractOpenParser
    {
        return this.parser as WiredContractOpenParser;
    }
}
