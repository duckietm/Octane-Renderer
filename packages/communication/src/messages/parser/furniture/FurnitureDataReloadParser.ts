import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export interface FurnidataDeltaEntry
{
    type: string; // "S" floor | "I" wall
    id: number;
    classname: string;
    name: string;
    description: string;
}

export class FurnitureDataReloadParser implements IMessageParser
{
    private static readonly MAX_ENTRIES = 100000;

    private _mode: number;
    private _entries: FurnidataDeltaEntry[];

    public flush(): boolean
    {
        this._mode = 0;
        this._entries = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._mode = wrapper.readInt();
        this._entries = [];

        if(this._mode === 0)
        {
            let count = wrapper.readInt();
            if(count < 0) count = 0;
            if(count > FurnitureDataReloadParser.MAX_ENTRIES) count = FurnitureDataReloadParser.MAX_ENTRIES;

            for(let i = 0; i < count; i++)
            {
                this._entries.push({
                    type: wrapper.readString(),
                    id: wrapper.readInt(),
                    classname: wrapper.readString(),
                    name: wrapper.readString(),
                    description: wrapper.readString()
                });
            }
        }

        return true;
    }

    public get mode(): number
    {
        return this._mode;
    }
    public get entries(): FurnidataDeltaEntry[]
    {
        return this._entries;
    }
}
