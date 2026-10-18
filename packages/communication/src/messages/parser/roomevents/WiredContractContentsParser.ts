import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { IWiredContractContents, IWiredContractDefinition, readWiredContractDefinition, WIRED_CONTRACT_TYPE_PAYMENT, WIRED_CONTRACT_TYPE_REWARD } from './WiredContractData';

/** AIR WiredContractController contents: contract id, SHORT type, the rules, then the type's own options. */
export class WiredContractContentsParser implements IMessageParser, IWiredContractContents
{
    public contractId = 0;
    public contractType: 0 | 1 | 2 = 0;
    public definition: IWiredContractDefinition = { youGiveRule: null, youGetRule: null };
    public paymentMode = 0;
    public receiveText = '';
    public layoutType = 'generic';
    public rewardCategory = 11;
    public showDialog = false;
    public rewardText = '';

    public flush(): boolean
    {
        this.contractId = 0;
        this.contractType = 0;
        this.definition = { youGiveRule: null, youGetRule: null };
        this.paymentMode = 0;
        this.receiveText = '';
        this.layoutType = 'generic';
        this.rewardCategory = 11;
        this.showDialog = false;
        this.rewardText = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();

        if(!wrapper) return false;

        try
        {
            this.contractId = wrapper.readInt();

            const type = wrapper.readShort();

            if(type !== 0 && type !== 1 && type !== 2) return false;

            this.contractType = type;
            this.definition = readWiredContractDefinition(wrapper);

            if(type === WIRED_CONTRACT_TYPE_PAYMENT)
            {
                this.paymentMode = wrapper.readShort();
                this.receiveText = wrapper.readString();
                this.layoutType = wrapper.readString();
            }

            if(type === WIRED_CONTRACT_TYPE_REWARD)
            {
                this.rewardCategory = wrapper.readShort();
                this.showDialog = wrapper.readBoolean();
                this.rewardText = wrapper.readString();
            }

            return true;
        }
        catch
        {
            this.flush();

            return false;
        }
    }
}
