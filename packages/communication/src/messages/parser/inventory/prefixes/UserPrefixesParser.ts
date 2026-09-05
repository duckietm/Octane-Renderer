import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IPrefixData
{
    id: number;
    text: string;
    color: string;
    icon: string;
    effect: string;
    font: string;
    active: boolean;
}

export class UserPrefixesParser implements IMessageParser
{
    private _prefixes: IPrefixData[];

    public flush(): boolean
    {
        this._prefixes = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._prefixes = [];

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._prefixes.push({
                id: wrapper.readInt(),
                text: wrapper.readString(),
                color: wrapper.readString(),
                icon: wrapper.readString(),
                effect: wrapper.readString(),
                font: wrapper.readString(),
                active: wrapper.readInt() === 1
            });

            count--;
        }

        return true;
    }

    public get prefixes(): IPrefixData[]
    {
        return this._prefixes;
    }
}
