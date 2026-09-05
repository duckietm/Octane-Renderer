import type { IRoomCameraWidgetEffect, RoomCameraWidgetBlendMode } from '@octane/api';
import type { ColorMatrix, Texture } from 'pixi.js';

export class RoomCameraWidgetEffect implements IRoomCameraWidgetEffect
{
    private _name: string;
    private _type: 'colormatrix' | 'composite' | 'frame';
    private _minLevel: number = -1;
    private _texture: Texture = null;
    private _colorMatrix: ColorMatrix = null;
    private _blendMode: RoomCameraWidgetBlendMode = 'normal';

    constructor(
        name: string,
        minLevel: number = -1,
        type: 'colormatrix' | 'composite' | 'frame' = 'composite',
        texture: Texture = null,
        colorMatrix: ColorMatrix = null,
        blendMode: RoomCameraWidgetBlendMode = 'normal'
    )
    {
        this._name = name;
        this._type = type;
        this._minLevel = minLevel;
        this._texture = texture;
        this._colorMatrix = colorMatrix;
        this._blendMode = blendMode;
    }

    public get name(): string
    {
        return this._name;
    }

    public get type(): 'colormatrix' | 'composite' | 'frame'
    {
        return this._type;
    }

    public get texture(): Texture
    {
        return this._texture;
    }

    public set texture(texture: Texture)
    {
        this._texture = texture;
    }

    public get colorMatrix(): ColorMatrix
    {
        return this._colorMatrix;
    }

    public set colorMatrix(colorMatrix: ColorMatrix)
    {
        this._colorMatrix = colorMatrix;
    }

    public get blendMode(): RoomCameraWidgetBlendMode
    {
        return this._blendMode;
    }

    public set blendMode(blendMode: RoomCameraWidgetBlendMode)
    {
        this._blendMode = blendMode;
    }

    public get minLevel(): number
    {
        return this._minLevel;
    }
}
