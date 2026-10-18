import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { WiredContractContentsParser } from '../../parser';

export class WiredContractContentsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, WiredContractContentsParser);
    }

    public getParser(): WiredContractContentsParser
    {
        return this.parser as WiredContractContentsParser;
    }
}
