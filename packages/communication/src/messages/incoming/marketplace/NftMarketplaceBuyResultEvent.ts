import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NftMarketplaceBuyResultParser } from '../../parser';

export class NftMarketplaceBuyResultEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NftMarketplaceBuyResultParser);
    }

    public getParser(): NftMarketplaceBuyResultParser
    {
        return this.parser as NftMarketplaceBuyResultParser;
    }
}
