import { IGraphicAsset, IVector3D } from '@octane/api';
import { PlaneMaskVisualization } from './PlaneMaskVisualization';

export class PlaneMask
{
    private _maskVisualizations: Map<number, PlaneMaskVisualization>;
    private _sizes: number[];
    private _assetNames: Map<number, string>;
    private _lastMaskVisualization: PlaneMaskVisualization;
    private _lastSize: number;

    constructor()
    {
        this._sizes = [];
        this._maskVisualizations = new Map();
        this._assetNames = new Map();
        this._lastMaskVisualization = null;
        this._lastSize = -1;
    }

    public dispose(): void
    {
        if(this._maskVisualizations)
        {
            for(const mask of this._maskVisualizations.values())
            {
                if(!mask) continue;

                mask.dispose();
            }

            this._maskVisualizations = null;
        }

        this._lastMaskVisualization = null;
        this._sizes = null;
    }

    public createMaskVisualization(size: number): PlaneMaskVisualization
    {
        const existing = this._maskVisualizations.get(size);

        if(existing) return null;

        const visualization = new PlaneMaskVisualization();

        this._maskVisualizations.set(size, visualization);

        this._sizes.push(size);
        this._sizes.sort();

        return visualization;
    }

    private getSizeIndex(size: number): number
    {
        let sizeIndex = 0;
        let index = 1;

        while(index < this._sizes.length)
        {
            if(this._sizes[index] > size)
            {
                if((this._sizes[index] - size) < (size - this._sizes[(index - 1)])) sizeIndex = index;

                break;
            }

            sizeIndex = index;

            index++;
        }

        return sizeIndex;
    }

    protected getMaskVisualization(size: number): PlaneMaskVisualization
    {
        if(size === this._lastSize) return this._lastMaskVisualization;

        const sizeIndex = this.getSizeIndex(size);

        if(sizeIndex < this._sizes.length)
        {
            this._lastMaskVisualization = (this._maskVisualizations.get(this._sizes[sizeIndex]));
        }
        else
        {
            this._lastMaskVisualization = null;
        }

        this._lastSize = size;

        return this._lastMaskVisualization;
    }

    public getGraphicAsset(size: number, normal: IVector3D): IGraphicAsset
    {
        const visualization = this.getMaskVisualization(size);

        if(!visualization) return null;

        return visualization.getAsset(normal);
    }

    public getVisualizationSize(size: number): number
    {
        if(!this._sizes || !this._sizes.length) return -1;

        const sizeIndex = this.getSizeIndex(size);

        if(sizeIndex < this._sizes.length) return this._sizes[sizeIndex];

        return -1;
    }

    public getAssetName(size: number): string
    {
        if(!this._assetNames) return null;

        return this._assetNames.get(size) || null;
    }

    public setAssetName(size: number, assetName: string): void
    {
        if(!this._assetNames) return;

        this._assetNames.set(size, assetName);
    }
}
