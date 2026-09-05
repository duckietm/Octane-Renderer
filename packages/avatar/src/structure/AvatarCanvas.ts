import { AvatarScaleType, IAssetAvatarGeometry } from '@octane/api';
import { Point } from 'pixi.js';

export class AvatarCanvas
{
    private _id: string;
    private _width: number;
    private _height: number;
    private _offset: Point;
    private _regPoint: Point;

    constructor(data: IAssetAvatarGeometry, scale: string)
    {
        this._id = data.id;
        this._width = data.width;
        this._height = data.height;
        this._offset = new Point(data.dx, data.dy);

        if(scale == AvatarScaleType.LARGE) this._regPoint = new Point(((this._width - 64) / 2), 0);
        else this._regPoint = new Point(((this._width - 32) / 2), 0);
    }

    public get width(): number
    {
        return this._width;
    }

    public get height(): number
    {
        return this._height;
    }

    public get offset(): Point
    {
        return this._offset;
    }

    public get id(): string
    {
        return this._id;
    }

    public get regPoint(): Point
    {
        return this._regPoint;
    }
}
