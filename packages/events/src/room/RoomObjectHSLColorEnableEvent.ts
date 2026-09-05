import { IRoomObject } from '@octane/api';
import { RoomObjectEvent } from './RoomObjectEvent';

export class RoomObjectHSLColorEnableEvent extends RoomObjectEvent
{
    public static ROOM_BACKGROUND_COLOR: string = 'ROHSLCEE_ROOM_BACKGROUND_COLOR';

    private _enable: boolean;
    private _hue: number;
    private _saturation: number;
    private _lightness: number;

    constructor(type: string, object: IRoomObject, enable: boolean, hue: number, saturation: number, lightness: number)
    {
        super(type, object);

        this._enable = enable;
        this._hue = hue;
        this._saturation = saturation;
        this._lightness = lightness;
    }

    public get enable(): boolean
    {
        return this._enable;
    }

    public get hue(): number
    {
        return this._hue;
    }

    public get saturation(): number
    {
        return this._saturation;
    }

    public get lightness(): number
    {
        return this._lightness;
    }
}
