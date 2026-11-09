import { IMessageDataWrapper, IMessageParser, IObjectData, LegacyDataType, ObjectDataFactory } from '@octane/api';
import { MarketplaceOffer } from './MarketplaceOffer';

export class MarketplaceOwnOffersParser implements IMessageParser
{
    private static MAX_LIST_LENGTH = 500;
    private _offers: MarketplaceOffer[];
    private _creditsWaiting: number;


    public flush(): boolean
    {
        this._offers = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._offers = [];
        this._creditsWaiting = wrapper.readInt(); // SoldPriceTotal

        const offerCount = wrapper.readInt();
        for(let i = 0; i < offerCount; i++)
        {
            const offerId = wrapper.readInt();
            const status = wrapper.readInt();
            let furniType = wrapper.readInt();

            let furniId;
            let extraData;
            let stuffData: IObjectData;
            let productCode: string = null;
            let nftFurniType = 0;
            if(furniType == 1)
            {
                furniId = wrapper.readInt();
                stuffData = this.getStuffData(wrapper);
            }
            else
            {
                if(furniType == 2)
                {
                    furniId = wrapper.readInt();
                    extraData = wrapper.readString();
                }
                else if(furniType == 3)
                {
                    furniId = wrapper.readInt();
                    stuffData = ObjectDataFactory.getData(LegacyDataType.FORMAT_KEY);
                    stuffData.uniqueNumber = wrapper.readInt();
                    stuffData.uniqueSeries = wrapper.readInt();
                    furniType = 1;
                }
                // A collectible: its product code, the furni and its kind (1 floor, 2 wall).
                else if(furniType == MarketplaceOffer.TYPE_NFT)
                {
                    productCode = wrapper.readString();
                    furniId = wrapper.readInt();
                    nftFurniType = wrapper.readInt();
                }
            }

            const price = wrapper.readInt();
            const local9 = wrapper.readInt();
            const local10 = wrapper.readInt();
            const local13 = new MarketplaceOffer(offerId, furniId, furniType, extraData, stuffData, price, status, local9, local10, -1, productCode, nftFurniType);

            if(i < MarketplaceOwnOffersParser.MAX_LIST_LENGTH)
            {
                this._offers.push(local13);
            }
        }

        return true;
    }

    public get offers(): MarketplaceOffer[]
    {
        return this._offers;
    }

    public get creditsWaiting(): number
    {
        return this._creditsWaiting;
    }

    private getStuffData(wrapper: IMessageDataWrapper): IObjectData
    {
        const local2 = wrapper.readInt();
        const local3 = ObjectDataFactory.getData(local2);
        local3.parseWrapper(wrapper);
        return local3;
    }
}
