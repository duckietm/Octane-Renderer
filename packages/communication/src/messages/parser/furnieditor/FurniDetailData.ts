import { IMessageDataWrapper } from '@octane/api';
import { FurniItemData } from './FurniItemData';

export class FurniDetailData extends FurniItemData
{
    public allowGift: boolean;
    public allowTrade: boolean;
    public allowRecycle: boolean;
    public allowMarketplaceSell: boolean;
    public allowInventoryStack: boolean;
    public vendingIds: string;
    public customparams: string;
    public effectIdMale: number;
    public effectIdFemale: number;
    public clothingOnWalk: string;
    public multiheight: string;
    public description: string;
    public usageCount: number;

    public override parse(wrapper: IMessageDataWrapper): void
    {
        super.parse(wrapper);

        this.allowGift = wrapper.readBoolean();
        this.allowTrade = wrapper.readBoolean();
        this.allowRecycle = wrapper.readBoolean();
        this.allowMarketplaceSell = wrapper.readBoolean();
        this.allowInventoryStack = wrapper.readBoolean();
        this.vendingIds = wrapper.readString();
        this.customparams = wrapper.readString();
        this.effectIdMale = wrapper.readInt();
        this.effectIdFemale = wrapper.readInt();
        this.clothingOnWalk = wrapper.readString();
        this.multiheight = wrapper.readString();
        this.description = wrapper.readString();
        this.usageCount = wrapper.readInt();
    }
}
