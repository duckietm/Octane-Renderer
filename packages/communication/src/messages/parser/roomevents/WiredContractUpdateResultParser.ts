import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** AIR WiredContractController.onContractUpdateResult: contract id, success, fail code (`wiredcontracts.error.<code>`). */
export class WiredContractUpdateResultParser implements IMessageParser
{
    public contractId = 0;
    public isSuccess = false;
    public failCode = '';

    public flush(): boolean
    {
        this.contractId = 0;
        this.isSuccess = false;
        this.failCode = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this.contractId = wrapper.readInt();
        this.isSuccess = wrapper.readBoolean();
        this.failCode = wrapper.readString();

        return true;
    }
}
