import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface IWheelRecentWin
{
    username: string;
    look: string;
    prizeLabel: string;
}

export class WheelRecentWinsParser implements IMessageParser
{
    private _wins: IWheelRecentWin[] = [];

    public flush(): boolean
    {
        this._wins = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();
        this._wins = [];

        for(let i = 0; i < count; i++)
        {
            this._wins.push({
                username: wrapper.readString(),
                look: wrapper.readString(),
                prizeLabel: wrapper.readString()
            });
        }

        return true;
    }

    public get wins(): IWheelRecentWin[]
    {
        return this._wins;
    }
}
