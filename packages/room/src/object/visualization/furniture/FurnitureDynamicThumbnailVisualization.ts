import { Texture } from 'pixi.js';
import { IsometricImageFurniVisualization } from './IsometricImageFurniVisualization';

export class FurnitureDynamicThumbnailVisualization extends IsometricImageFurniVisualization
{
    private _cachedUrl: string;
    private _disposed: boolean = false;

    constructor()
    {
        super();

        this._cachedUrl = null;
        this._hasOutline = true;
    }

    public dispose(): void
    {
        this._disposed = true;
        this._cachedUrl = null;

        super.dispose();
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

                    // Set before src, or the browser may already have started the request without CORS.
                    image.crossOrigin = 'anonymous';
                    image.src = thumbnailUrl;

                    image.onload = () =>
                    {
                        // A load for an older url, or one that ends after the furni went away, changes nothing.
                        if(this._disposed || this._cachedUrl !== thumbnailUrl)
                        {
                            image.onload = null;
                            image.onerror = null;

                            return;
                        }

                        if(image.complete && image.width > 0 && image.height > 0)
                        {
                            const texture = Texture.from(image, true);
                            texture.source.scaleMode = 'linear';

                            this.setThumbnailImages(texture, thumbnailUrl, true);
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
                        if(!this._disposed && this._cachedUrl === thumbnailUrl) this.setThumbnailImages(null);
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