import { IGraphicAsset, IVector3D } from '@octane/api';
import { PlaneMaskBitmap } from './PlaneMaskBitmap';

export class PlaneMaskVisualization
{
    public static MIN_NORMAL_COORDINATE_VALUE: number = -1;
    public static MAX_NORMAL_COORDINATE_VALUE: number = 1;

    private _bitmaps: PlaneMaskBitmap[];

    constructor()
    {
        this._bitmaps = [];
    }

    public dispose(): void
    {
        for(const mask of this._bitmaps)
        {
            if(!mask) continue;

            mask.dispose();
        }

        this._bitmaps = null;
    }

    public addBitmap(asset: IGraphicAsset, normalMinX: number = -1, normalMaxX: number = 1, normalMinY: number = -1, normalMaxY: number = 1): void
    {
        this._bitmaps.push(new PlaneMaskBitmap(asset, normalMinX, normalMaxX, normalMinY, normalMaxY));
    }

    public getAsset(normal: IVector3D): IGraphicAsset
    {
        if(!normal) return null;

        for(const mask of this._bitmaps)
        {
            if(!mask) continue;

            if((((normal.x >= mask.normalMinX) && (normal.x <= mask.normalMaxX)) && (normal.y >= mask.normalMinY)) && (normal.y <= mask.normalMaxY))
            {
                return mask.asset;
            }
        }

        return null;
    }
}
