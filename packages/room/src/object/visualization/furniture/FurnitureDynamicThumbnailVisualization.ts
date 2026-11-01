import { GetConfiguration } from '@octane/configuration';
import { DEFAULT_FURNI_IMAGE_HOSTS, isAllowedFurniImageUrl, parseHostList } from '@octane/utils';
import { Texture } from 'pixi.js';
import { IsometricImageFurniVisualization } from './IsometricImageFurniVisualization';

export class FurnitureDynamicThumbnailVisualization extends IsometricImageFurniVisualization
{
    // A larger image is not drawn: the URL comes from user data and decoding it costs memory for everyone in the room.
    public static MAXIMUM_IMAGE_SIDE: number = 2048;

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
            const thumbnailUrl = FurnitureDynamicThumbnailVisualization.allowedUrl(this.getThumbnailURL());

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

                        const side = FurnitureDynamicThumbnailVisualization.MAXIMUM_IMAGE_SIDE;

                        if(image.complete && image.width > 0 && image.height > 0 && image.width <= side && image.height <= side)
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

    /** The URL when the hotel allows furni images from its host, otherwise null. */
    private static allowedUrl(url: string): string
    {
        if(!url) return url;

        const configuration = GetConfiguration();
        const hosts = configuration.getValue<unknown>('furni.external.image.hosts', null);
        const allowedHosts = (hosts === null || hosts === undefined) ? DEFAULT_FURNI_IMAGE_HOSTS : parseHostList(hosts);
        const trustedUrls = ['camera.url', 'thumbnails.url', 'url.prefix']
            .map(key => configuration.getValue<string>(key, ''))
            .filter(value => (typeof value === 'string') && value.length);

        return isAllowedFurniImageUrl(url, allowedHosts, trustedUrls) ? url : null;
    }
}