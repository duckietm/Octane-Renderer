import { IMessageDataWrapper, IMessageParser } from '@octane/api';

const MAX_METADATA_ENTRIES = 500;

export interface CatalogProductMetadataEntry
{
    offerId: number;
    itemBaseId: number;
    productClassId: number;
    tradeable: boolean;
    recyclable: boolean;
}

export class CatalogProductMetadataMessageParser implements IMessageParser
{
    public protocolVersion = 0;
    public requestId = '';
    public pageId = 0;
    public entries: CatalogProductMetadataEntry[] = [];

    public flush(): boolean
    {
        this.protocolVersion = 0;
        this.requestId = '';
        this.pageId = 0;
        this.entries = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();

        if(!wrapper) return false;

        this.protocolVersion = wrapper.readInt();
        this.requestId = wrapper.readString();
        this.pageId = wrapper.readInt();

        if(this.protocolVersion !== 1) return false;

        const count = wrapper.readInt();

        if(count < 0 || count > MAX_METADATA_ENTRIES) return false;

        for(let index = 0; index < count; index++)
        {
            const offerId = wrapper.readInt();
            const itemBaseId = wrapper.readInt();
            const productClassId = wrapper.readInt();
            const flags = wrapper.readByte();

            this.entries.push({
                offerId,
                itemBaseId,
                productClassId,
                tradeable: (flags & 1) !== 0,
                recyclable: (flags & 2) !== 0
            });
        }

        return true;
    }
}
