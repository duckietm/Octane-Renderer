import { OctaneEvent } from './OctaneEvent';

export class ReconnectEvent extends OctaneEvent
{
    private _attempt: number;
    private _maxAttempts: number;

    constructor(type: string, attempt: number = 0, maxAttempts: number = 0)
    {
        super(type);

        this._attempt = attempt;
        this._maxAttempts = maxAttempts;
    }

    public get attempt(): number
    {
        return this._attempt;
    }

    public get maxAttempts(): number
    {
        return this._maxAttempts;
    }
}
