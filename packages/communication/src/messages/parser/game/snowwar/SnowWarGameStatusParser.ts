import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { SnowWarSubturnEventData } from './SnowWarSubturnEventData';

export class SnowWarGameStatusParser implements IMessageParser
{
    private _turn: number;
    private _checksum: number;
    private _subturns: SnowWarSubturnEventData[][];

    public flush(): boolean
    {
        this._turn = -1;
        this._checksum = 0;
        this._subturns = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._turn = wrapper.readInt();
        this._checksum = wrapper.readInt();

        let totalSubturns = wrapper.readInt();

        while(totalSubturns > 0)
        {
            const events: SnowWarSubturnEventData[] = [];

            let totalEvents = wrapper.readInt();

            while(totalEvents > 0)
            {
                events.push(new SnowWarSubturnEventData(wrapper));

                totalEvents--;
            }

            this._subturns.push(events);

            totalSubturns--;
        }

        return true;
    }

    public get turn(): number
    {
        return this._turn;
    }

    public get checksum(): number
    {
        return this._checksum;
    }

    public get subturnCount(): number
    {
        return this._subturns.length;
    }

    public get subturns(): SnowWarSubturnEventData[][]
    {
        return this._subturns;
    }
}
