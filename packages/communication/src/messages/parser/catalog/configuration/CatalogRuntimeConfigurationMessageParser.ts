import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class CatalogRuntimeConfigurationMessageParser implements IMessageParser
{
    public protocolVersion = 0;
    public requestId = '';
    public recyclerSlotCount = 8;

    public flush(): boolean
    {
        this.protocolVersion = 0;
        this.requestId = '';
        this.recyclerSlotCount = 8;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();

        if(!wrapper) return false;

        this.protocolVersion = wrapper.readInt();
        this.requestId = wrapper.readString();
        this.recyclerSlotCount = wrapper.readInt();

        return this.protocolVersion === 1 && this.recyclerSlotCount > 0 && this.recyclerSlotCount <= 12;
    }
}
