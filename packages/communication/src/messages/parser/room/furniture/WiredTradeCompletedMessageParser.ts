import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

/**
 * The negotiation settled. Carries nothing: what changed hands arrives through the inventory and
 * currency updates the client already acts on.
 */
export class WiredTradeCompletedMessageParser implements IMessageParser
{
    public flush(): boolean
    {
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        return true;
    }
}
