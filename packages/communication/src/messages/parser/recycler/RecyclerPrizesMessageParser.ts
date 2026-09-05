import { IMessageDataWrapper, IMessageParser } from '@octane/api';

const MAX_LEVELS = 50;
const MAX_PRODUCTS_PER_LEVEL = 500;

export interface RecyclerPrizeProduct
{
    name: string;
    count: number;
    productType: string;
    productClassId: number;
}

export interface RecyclerPrizeLevel
{
    levelId: number;
    chance: number;
    products: RecyclerPrizeProduct[];
}

export class RecyclerPrizesMessageParser implements IMessageParser
{
    public levels: RecyclerPrizeLevel[] = [];

    public flush(): boolean
    {
        this.levels = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();

        if(!wrapper) return false;

        const levelCount = wrapper.readInt();

        if(levelCount < 0 || levelCount > MAX_LEVELS) return false;

        for(let levelIndex = 0; levelIndex < levelCount; levelIndex++)
        {
            const levelId = wrapper.readInt();
            const chance = wrapper.readInt();
            const productCount = wrapper.readInt();

            if(productCount < 0 || productCount > MAX_PRODUCTS_PER_LEVEL)
            {
                this.flush();
                return false;
            }

            const products: RecyclerPrizeProduct[] = [];

            for(let productIndex = 0; productIndex < productCount; productIndex++)
            {
                products.push({
                    name: wrapper.readString(),
                    count: wrapper.readInt(),
                    productType: wrapper.readString(),
                    productClassId: wrapper.readInt()
                });
            }

            this.levels.push({ levelId, chance, products });
        }

        return true;
    }
}
