import { IGraphicAsset, RoomObjectVariable } from '@octane/api';
import { Matrix, RenderTexture, Texture } from 'pixi.js';
import { FurnitureDynamicThumbnailVisualization } from './FurnitureDynamicThumbnailVisualization';

export class FurnitureExternalImageVisualization extends FurnitureDynamicThumbnailVisualization
{
    private _url: string;
    private _typePrefix: string;

    constructor()
    {
        super();

        this._url = null;
        this._typePrefix = null;
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
        const scale = Math.min(asset.width / texW, asset.height / texH);

        const matrix = new Matrix();
        matrix.a = scale;
        matrix.c = 0;
        matrix.d = scale;
        matrix.tx = 0;
        matrix.ty = 0;

        if(this.direction === 2)
        {
            matrix.b = -(0.5 * scale);
        }
        else if(this.direction === 0 || this.direction === 4)
        {
            matrix.b = 0.5 * scale;
        }
        else
        {
            matrix.b = 0;
        }

        const renderTexture = this.renderThumbnailWithMatrix(texture, matrix);

        if(outlineTexture) outlineTexture.destroy(true);

        return renderTexture;
    }

    protected getThumbnailURL(): string
    {
        if(!this.object) return null;

        if(this._url) return this._url;

        const jsonString = this.object.model.getValue<string>(RoomObjectVariable.FURNITURE_DATA);

        if(!jsonString || jsonString === '') return null;

        if(this.object.type.indexOf('') >= 0)
        {
            this._typePrefix = (this.object.type.indexOf('') >= 0) ? '' : 'postcards/selfie/';
        }

        const json = JSON.parse(jsonString);

        let url = (json.w || '');

        url = this.buildThumbnailUrl(url);

        this._url = url;

        return this._url;
    }

    private buildThumbnailUrl(url: string): string
    {
        url = url.replace('.png', '_small.png');

        if(url.indexOf('.png') === -1) url = (url + '_small.png');

        return url;
    }
}