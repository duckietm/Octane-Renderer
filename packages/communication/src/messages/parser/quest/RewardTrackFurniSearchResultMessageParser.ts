import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface RewardTrackFurniMatch
{
    name: string;
    spriteId: number;
    typeCode: string;
}

/** RewardTrackFurniSearchResult (10107): the query back, then name, sprite id and floor/wall code of each match. */
export class RewardTrackFurniSearchResultMessageParser implements IMessageParser
{
    private _query: string;
    private _matches: RewardTrackFurniMatch[];

    public flush(): boolean
    {
        this._query = '';
        this._matches = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._query = wrapper.readString();

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            this._matches.push({
                name: wrapper.readString(),
                spriteId: wrapper.readInt(),
                typeCode: wrapper.readString()
            });
        }

        return true;
    }

    public get query(): string
    {
        return this._query;
    }

    public get matches(): RewardTrackFurniMatch[]
    {
        return this._matches;
    }
}
