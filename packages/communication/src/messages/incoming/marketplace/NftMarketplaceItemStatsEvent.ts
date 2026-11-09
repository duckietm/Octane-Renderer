import { IMessageEvent } from '@octane/api';
import { MessageEvent } from '@octane/events';
import { NftMarketplaceItemStatsParser } from '../../parser';

export class NftMarketplaceItemStatsEvent extends MessageEvent implements IMessageEvent
{
    constructor(callBack: Function)
    {
        super(callBack, NftMarketplaceItemStatsParser);
    }

    public getParser(): NftMarketplaceItemStatsParser
    {
        return this.parser as NftMarketplaceItemStatsParser;
    }
}
