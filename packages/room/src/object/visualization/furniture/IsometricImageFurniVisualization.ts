import { IGraphicAsset } from '@nitrots/api';
import { GetRenderer } from '@nitrots/utils';
import { Container, Matrix, Sprite, Texture, RenderTexture } from 'pixi.js';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';

export class IsometricImageFurniVisualization extends FurnitureAnimatedVisualization
{
    protected static THUMBNAIL: string = 'THUMBNAIL';

    private _thumbnailImageNormal: Texture;
    private _thumbnailDirection: number;
    private _thumbnailSize: number;
    private _thumbnailChanged: boolean;
    private _thumbnailLayerId: number;
    private _thumbnailTexture: Texture;
    private _uniqueId: string;
    private _photoUrl: string;
    protected _hasOutline: boolean;

    constructor()
    {
        super();

        this._thumbnailImageNormal = null;
        this._thumbnailDirection = -1;
        this._thumbnailSize = -1;
        this._thumbnailChanged = false;
        this._thumbnailLayerId = -1;
        this._thumbnailTexture = null;
        this._uniqueId = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
        this._photoUrl = null;
    }

    public dispose(): void
    {
        if(this._thumbnailTexture instanceof RenderTexture)
        {
            this._thumbnailTexture.destroy(true);
        }

        this._thumbnailTexture = null;
        this._thumbnailImageNormal = null;

        super.dispose();
    }

    public get hasThumbnailImage(): boolean
    {
        return !(this._thumbnailImageNormal == null);
    }

    public setThumbnailImages(texture: Texture, url?: string): void
    {
        this._thumbnailImageNormal = texture;
        this._photoUrl = url || null;
        this._thumbnailChanged = true;
    }

    public getPhotoUrl(): string
    {
        return this._photoUrl;
    }

    protected updateModel(scale: number): boolean
    {
        const flag = super.updateModel(scale);

        const size = this.getValidSize(scale);

        if(!this._thumbnailChanged && (this._thumbnailDirection === this.direction) && (this._thumbnailSize === size))
        {
            return flag;
        }

        this.refreshThumbnail(size);

        return true;
    }

    private refreshThumbnail(size: number): void
    {
        if(this.asset == null)
        {
            return;
        }

        if(this._thumbnailImageNormal)
        {
            this.addThumbnailAsset(this._thumbnailImageNormal, size);
        }
        else
        {
            if(this._thumbnailTexture instanceof RenderTexture)
            {
                this._thumbnailTexture.destroy(true);
            }
            this._thumbnailTexture = null;
            this._thumbnailLayerId = -1;
        }

        this._thumbnailChanged = false;
        this._thumbnailDirection = this.direction;
        this._thumbnailSize = size;
    }

    private addThumbnailAsset(texture: Texture, scale: number): void
    {
        let layerId = 0;

        while(layerId < this.totalSprites)
        {
            const layerTag = this.getLayerTag(scale, this.direction, layerId);

            if(layerTag === IsometricImageFurniVisualization.THUMBNAIL)
            {
                this._thumbnailLayerId = layerId;

                const assetName = (this.cacheSpriteAssetName(scale, layerId, false) + this.getFrameNumber(scale, layerId));
                const asset = this.getAsset(assetName, layerId);

                if(asset)
                {
                    if(this._thumbnailTexture instanceof RenderTexture)
                    {
                        this._thumbnailTexture.destroy(true);
                    }
                    this._thumbnailTexture = this.generateTransformedThumbnail(texture, asset);
                }

                return;
            }

            layerId++;
        }
    }

    protected updateSprite(scale: number, layerId: number): void
    {
        super.updateSprite(scale, layerId);

        if(this._thumbnailTexture && this._thumbnailLayerId === layerId)
        {
            const sprite = this.getSprite(layerId);
            if(sprite)
            {
                sprite.texture = this._thumbnailTexture;
                sprite.offsetY -= 1;
            }
        }
    }

    protected generateTransformedThumbnail(texture: Texture, asset: IGraphicAsset): Texture
    {
        let outlineTexture: RenderTexture = null;

        if(this._hasOutline)
        {
            outlineTexture = this.buildOutlinedTexture(texture);
            texture = outlineTexture;
        }

        texture.source.scaleMode = 'linear';

        const texW = texture.width;
        const texH = texture.height;
        const scaleX = asset.width / texW;
        const scaleY = asset.height / texH;

        const matrix = new Matrix();

        switch(this.direction)
        {
            case 2:
                matrix.a = scaleX;
                matrix.b = -(0.5 * scaleX);
                matrix.c = 0;
                matrix.d = scaleY / 1.6;
                matrix.tx = 0;
                matrix.ty = 0.5 * scaleX * texW;
                break;
            case 0:
            case 4:
                matrix.a = scaleX;
                matrix.b = 0.5 * scaleX;
                matrix.c = 0;
                matrix.d = scaleY / 1.6;
                matrix.tx = 0;
                matrix.ty = 0;
                break;
            default:
                matrix.a = scaleX;
                matrix.b = 0;
                matrix.c = 0;
                matrix.d = scaleY;
                matrix.tx = 0;
                matrix.ty = 0;
        }

        const renderTexture = this.renderThumbnailWithMatrix(texture, matrix);

        if(outlineTexture) outlineTexture.destroy(true);

        return renderTexture;
    }

    protected buildOutlinedTexture(texture: Texture): RenderTexture
    {
        const borderSize = 20;
        const bgWidth = texture.width + borderSize * 2;
        const bgHeight = texture.height + borderSize * 2;

        const container = new Container();
        const background = new Sprite(Texture.WHITE);
        background.tint = 0x000000;
        background.width = bgWidth;
        background.height = bgHeight;

        const imageSprite = new Sprite(texture);
        imageSprite.position.set(borderSize, borderSize);

        container.addChild(background, imageSprite);

        const outlineTexture = RenderTexture.create({ width: bgWidth, height: bgHeight, resolution: 1 });
        GetRenderer().render({ container, target: outlineTexture, clear: true });

        return outlineTexture;
    }

    protected renderThumbnailWithMatrix(texture: Texture, matrix: Matrix): RenderTexture
    {
        const texW = texture.width;
        const texH = texture.height;

        const corners = [
            { x: matrix.tx, y: matrix.ty },
            { x: matrix.a * texW + matrix.tx, y: matrix.b * texW + matrix.ty },
            { x: matrix.c * texH + matrix.tx, y: matrix.d * texH + matrix.ty },
            { x: matrix.a * texW + matrix.c * texH + matrix.tx, y: matrix.b * texW + matrix.d * texH + matrix.ty }
        ];

        let minX = corners[0].x, minY = corners[0].y;
        let maxX = corners[0].x, maxY = corners[0].y;

        for(const corner of corners)
        {
            if(corner.x < minX) minX = corner.x;
            if(corner.y < minY) minY = corner.y;
            if(corner.x > maxX) maxX = corner.x;
            if(corner.y > maxY) maxY = corner.y;
        }

        const renderWidth = Math.ceil(maxX - minX);
        const renderHeight = Math.ceil(maxY - minY);

        matrix.tx -= minX;
        matrix.ty -= minY;

        const transformedSprite = new Sprite(texture);
        transformedSprite.setFromMatrix(matrix);

        const renderTexture = RenderTexture.create({ width: renderWidth, height: renderHeight, resolution: 1 });
        GetRenderer().render({ container: transformedSprite, target: renderTexture, clear: true });

        return renderTexture;
    }

}
