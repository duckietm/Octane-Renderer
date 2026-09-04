import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export interface IRareValue
{
    credits: number;
    points: number;
    pointsType: number;
}

export class RareValuesParser implements IMessageParser
{
    private _values: Map<number, IRareValue> = new Map();

    public flush(): boolean
    {
        this._values = new Map();

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            const spriteId = wrapper.readInt();
            const credits = wrapper.readInt();
            const points = wrapper.readInt();
            const pointsType = wrapper.readInt();

            this._values.set(spriteId, { credits, points, pointsType });
        }

        return true;
    }

    public get values(): Map<number, IRareValue>
    {
        return this._values;
    }
}
