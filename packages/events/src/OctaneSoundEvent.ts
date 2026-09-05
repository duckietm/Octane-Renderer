import { OctaneEvent } from './core';

export class OctaneSoundEvent extends OctaneEvent
{
    public static PLAY_SOUND: string = 'NSOE_PLAY_SOUND';

    private _sampleCode: string;

    constructor(type: string, sampleCode: string)
    {
        super(type);
        this._sampleCode = sampleCode;
    }

    public get sampleCode(): string
    {
        return this._sampleCode;
    }
}
