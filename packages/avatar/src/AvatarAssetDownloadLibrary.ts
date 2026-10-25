import { IAssetManager, IAvatarAssetDownloadLibrary } from '@octane/api';
import { AvatarRenderLibraryEvent, GetEventDispatcher, OctaneEventType } from '@octane/events';

export class AvatarAssetDownloadLibrary implements IAvatarAssetDownloadLibrary
{
    private static NOT_LOADED: number = 0;
    private static LOADING: number = 1;
    private static LOADED: number = 2;

    // A library that failed is not asked for again at once: every figure using a missing asset requested it anew, so
    // a crowded room produced a burst of 404s. The wait doubles with each failure, up to the cap.
    public static RETRY_BASE_MS: number = 30_000;
    public static RETRY_MAX_MS: number = 10 * 60_000;

    private _state: number = AvatarAssetDownloadLibrary.NOT_LOADED;
    private _libraryName: string;
    private _revision: string;
    private _downloadUrl: string;
    private _assetManager: IAssetManager;
    private _failures: number = 0;
    private _retryAt: number = 0;
    private _now: () => number;

    constructor(libraryName: string, revision: string, downloadUrl: string, assetManager: IAssetManager, now: () => number = () => Date.now())
    {
        this._libraryName = libraryName;
        this._revision = revision;
        this._downloadUrl = downloadUrl;
        this._assetManager = assetManager;
        this._now = now;

        this._downloadUrl = this._downloadUrl.replace(/%libname%/gi, this._libraryName);
        this._downloadUrl = this._downloadUrl.replace(/%revision%/gi, this._revision);

        this.checkIsLoaded();
    }

    public async downloadAsset(): Promise<void>
    {
        if(!this._assetManager || (this._state === AvatarAssetDownloadLibrary.LOADING) || (this._state === AvatarAssetDownloadLibrary.LOADED)) return;

        if(!this.checkIsLoaded())
        {
            if(this.isBackingOff) throw new Error('Asset download backing off after a failure');

            this._state = AvatarAssetDownloadLibrary.LOADING;

            let status = false;

            try
            {
                status = await this._assetManager.downloadAsset(this._downloadUrl);
            }
            finally
            {
                // A failed library may be requested again later, once its wait is over.
                if(!status)
                {
                    this._state = AvatarAssetDownloadLibrary.NOT_LOADED;
                    this._failures++;
                    this._retryAt = this._now() + Math.min(AvatarAssetDownloadLibrary.RETRY_MAX_MS, AvatarAssetDownloadLibrary.RETRY_BASE_MS * (2 ** (this._failures - 1)));
                }
                else
                {
                    this._failures = 0;
                    this._retryAt = 0;
                }
            }

            if(!status) throw new Error('Could not download asset');
        }

        if(this.checkIsLoaded()) GetEventDispatcher().dispatchEvent(new AvatarRenderLibraryEvent(OctaneEventType.AVATAR_ASSET_DOWNLOADED, this));
    }

    private checkIsLoaded(): boolean
    {
        const asset = this._assetManager.getCollection(this._libraryName);

        if(!asset) return false;

        this._state = AvatarAssetDownloadLibrary.LOADED;

        return true;
    }

    public get libraryName(): string
    {
        return this._libraryName;
    }

    /** Whether a failed download is still waiting before it may be tried again. */
    public get isBackingOff(): boolean
    {
        return (this._state === AvatarAssetDownloadLibrary.NOT_LOADED) && (this._now() < this._retryAt);
    }

    public get isLoaded(): boolean
    {
        return (this._state === AvatarAssetDownloadLibrary.LOADED);
    }
}
