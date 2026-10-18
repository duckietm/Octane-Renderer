import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** AIR WiredContractController.onOpenContract: the contract furni to fetch, nothing else. */
export class WiredContractOpenParser implements IMessageParser
{
    public contractId = 0;

    public flush(): boolean
    {
        this.contractId = 0;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this.contractId = wrapper.readInt();

        return true;
    }
}
