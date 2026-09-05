import { IMessageDataWrapper } from '@octane/api';

export class CategoriesWithVisitorCountData
{
    private _categoryToCurrentUserCountMap: Map<number, number>;
    private _categoryToMaxUserCountMap: Map<number, number>;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._categoryToCurrentUserCountMap = new Map();
        this._categoryToMaxUserCountMap = new Map();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const categoryId = wrapper.readInt();
            const currentUserCount = wrapper.readInt();
            const maxUserCount = wrapper.readInt();
            this._categoryToCurrentUserCountMap.set(categoryId, currentUserCount);
            this._categoryToMaxUserCountMap.set(categoryId, maxUserCount);
        }
    }

    public get categoryToCurrentUserCountMap(): Map<number, number>
    {
        return this._categoryToCurrentUserCountMap;
    }

    public get categoryToMaxUserCountMap(): Map<number, number>
    {
        return this._categoryToMaxUserCountMap;
    }
}
