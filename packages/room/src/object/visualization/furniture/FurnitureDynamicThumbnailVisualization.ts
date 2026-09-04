import { Texture } from 'pixi.js';
import { IsometricImageFurniVisualization } from './IsometricImageFurniVisualization';

export class FurnitureDynamicThumbnailVisualization extends IsometricImageFurniVisualization
{
    private _cachedUrl: string;

    constructor()
    {
        super();

        this._cachedUrl = null;
        this._hasOutline = true;
    }

    protected updateModel(scale: number): boolean
    {
        if(this.object)
        {
            const thumbnailUrl = this.getThumbnailURL();

            if(this._cachedUrl !== thumbnailUrl)
            {
                this._cachedUrl = thumbnailUrl;

                if(this._cachedUrl && this._cachedUrl !== '')
                {
                    const image = new Image();

                    image.src = thumbnailUrl;
                    image.crossOrigin = '*';

                    image.onload = () =>
                    {
                        if(image.complete && image.width > 0 && image.height > 0)
                        {
                            const texture = Texture.from(image);
                            texture.source.scaleMode = 'linear';

                            this.setThumbnailImages(texture, thumbnailUrl);
                        }
                        else
                        {
                            this.setThumbnailImages(null);
                        }
                        image.onload = null;
                        image.onerror = null;
                    };

                    image.onerror = () =>
                    {
                        this.setThumbnailImages(null);
                        image.onload = null;
                        image.onerror = null;
                    };
                }
                else
                {
                    this.setThumbnailImages(null);
                }
            }
        }

        return super.updateModel(scale);
    }

    protected getThumbnailURL(): string
    {
        throw new Error('This method must be overridden!');
    }
}