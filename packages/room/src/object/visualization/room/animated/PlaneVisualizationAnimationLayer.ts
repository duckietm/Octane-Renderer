import { IAssetPlaneVisualizationAnimatedLayerItem, IGraphicAssetCollection } from '@octane/api';
import { TextureUtils } from '@octane/utils';
import { RenderTexture, Sprite } from 'pixi.js';
import { AnimationItem } from './AnimationItem';

export class PlaneVisualizationAnimationLayer
{
    private static RANDOM_SEED: number = 131071;

    private _isDisposed: boolean = false;
    private _items: AnimationItem[] = [];
    private _randomState: number;

    constructor(items: IAssetPlaneVisualizationAnimatedLayerItem[], assets: IGraphicAssetCollection)
    {
        this._randomState = PlaneVisualizationAnimationLayer.RANDOM_SEED;

        if(items && assets)
        {
            for(const item of items)
            {
                if(!item) continue;

                const assetName = item.assetId;

                if(assetName)
                {
                    const asset = assets.getAsset(assetName);

                    if(asset)
                    {
                        const x = this.parseCoordinate(item.x, item.randomX);
                        const y = this.parseCoordinate(item.y, item.randomY);

                        this._items.push(new AnimationItem(x, y, item.speedX || 0, item.speedY || 0, asset));
                    }
                }
            }
        }
    }

    private seededRandom(): number
    {
        this._randomState = ((this._randomState * 1103515245 + 12345) & 0x7fffffff);

        return (this._randomState % 10000) / 10000;
    }

    private parseCoordinate(value: string, randomValue: string): number
    {
        let result = 0;

        if(value)
        {
            if(value.includes('%'))
            {
                result = parseFloat(value.replace('%', '')) / 100;
            }
            else
            {
                result = parseFloat(value);
            }
        }

        if(randomValue)
        {
            const random = parseFloat(randomValue);
            if(!isNaN(random)) result += (this.seededRandom() * random);
        }

        return result;
    }

    public get disposed(): boolean
    {
        return this._isDisposed;
    }

    public get hasItems(): boolean
    {
        return this._items.length > 0;
    }

    public dispose(): void
    {
        this._isDisposed = true;

        if(this._items)
        {
            for(const item of this._items)
            {
                if(item) item.dispose();
            }

            this._items = [];
        }
    }

    public render(
        canvas: RenderTexture,
        offsetX: number,
        offsetY: number,
        maxX: number,
        maxY: number,
        dimensionX: number,
        dimensionY: number,
        timeSinceStartMs: number
    ): RenderTexture
    {
        if(maxX <= 0 || maxY <= 0) return canvas;

        for(const item of this._items)
        {
            if(!item || !item.bitmapData) continue;

            const point = item.getPosition(maxX, maxY, dimensionX, dimensionY, timeSinceStartMs);
            point.x = Math.trunc(point.x - offsetX);
            point.y = Math.trunc(point.y - offsetY);

            const assetWidth = item.bitmapData.width;
            const assetHeight = item.bitmapData.height;

            if(this.isVisible(point.x, point.y, assetWidth, assetHeight, canvas.width, canvas.height))
            {
                this.renderSprite(item, point.x, point.y, canvas);
            }

            if(this.isVisible(point.x - maxX, point.y, assetWidth, assetHeight, canvas.width, canvas.height))
            {
                this.renderSprite(item, point.x - maxX, point.y, canvas);
            }

            if(this.isVisible(point.x, point.y - maxY, assetWidth, assetHeight, canvas.width, canvas.height))
            {
                this.renderSprite(item, point.x, point.y - maxY, canvas);
            }

            if(this.isVisible(point.x - maxX, point.y - maxY, assetWidth, assetHeight, canvas.width, canvas.height))
            {
                this.renderSprite(item, point.x - maxX, point.y - maxY, canvas);
            }
        }

        return canvas;
    }

    private isVisible(x: number, y: number, width: number, height: number, canvasWidth: number, canvasHeight: number): boolean
    {
        return (x > -width) && (x < canvasWidth) && (y > -height) && (y < canvasHeight);
    }

    private renderSprite(item: AnimationItem, x: number, y: number, canvas: RenderTexture): void
    {
        const sprite = new Sprite(item.bitmapData.texture);
        sprite.position.set(x, y);
        TextureUtils.writeToTexture(sprite, canvas, false);
        sprite.destroy();
    }
}
