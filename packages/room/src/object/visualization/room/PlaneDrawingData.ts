import { IPlaneDrawingData } from '@octane/api';
import { Point } from 'pixi.js';

export class PlaneDrawingData implements IPlaneDrawingData
{
    private _z: number;
    private _points: Point[];
    private _color: number;
    private _maskAssetNames: string[];
    private _maskAssetLocations: Point[];
    private _maskAssetFlipHs: boolean[];
    private _maskAssetFlipVs: boolean[];
    private _alignBottom: boolean;
    private _assetNames: string[][];

    constructor(source: PlaneDrawingData = null, color: number = 0, alignBottom: boolean = false)
    {
        this._assetNames = [];
        this._maskAssetNames = [];
        this._maskAssetLocations = [];
        this._maskAssetFlipHs = [];
        this._maskAssetFlipVs = [];

        if(source != null)
        {
            this._maskAssetNames = source._maskAssetNames;
            this._maskAssetLocations = source._maskAssetLocations;
            this._maskAssetFlipHs = source._maskAssetFlipHs;
            this._maskAssetFlipVs = source._maskAssetFlipVs;
        }

        this._color = color;
        this._alignBottom = alignBottom;
    }

    public addMask(assetName: string, location: Point, flipH: boolean, flipV: boolean): void
    {
        this._maskAssetNames.push(assetName);
        this._maskAssetLocations.push(location);
        this._maskAssetFlipHs.push(flipH);
        this._maskAssetFlipVs.push(flipV);
    }

    public addAssetColumn(column: string[]): void
    {
        this._assetNames.push(column);
    }

    public set z(value: number)
    {
        this._z = value;
    }

    public get z(): number
    {
        return this._z;
    }

    public set cornerPoints(value: Point[])
    {
        this._points = value;
    }

    public get cornerPoints(): Point[]
    {
        return this._points;
    }

    public get color(): number
    {
        return this._color;
    }

    public get maskAssetNames(): string[]
    {
        return this._maskAssetNames;
    }

    public get maskAssetLocations(): Point[]
    {
        return this._maskAssetLocations;
    }

    public get maskAssetFlipHs(): boolean[]
    {
        return this._maskAssetFlipHs;
    }

    public get maskAssetFlipVs(): boolean[]
    {
        return this._maskAssetFlipVs;
    }

    public isBottomAligned(): boolean
    {
        return this._alignBottom;
    }

    public get assetNameColumns(): string[][]
    {
        return this._assetNames;
    }
}
