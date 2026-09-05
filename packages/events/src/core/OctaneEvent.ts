import { IOctaneEvent } from '@octane/api';

export class OctaneEvent implements IOctaneEvent
{
    private _type: string;

    constructor(type: string)
    {
        this._type = type;
    }

    public get type(): string
    {
        return this._type;
    }
}
