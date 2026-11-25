import { IAsset, IAssetData, IAssetManager, IGraphicAsset, IGraphicAssetCollection } from '@octane/api';
import { OctaneBundle, OctaneBundleTextureDecoder, OctaneLogger, parseConfigJsonFromResponse, takePrefetchedBuffer, takePrefetchedResponse } from '@octane/utils';
import { Spritesheet, SpritesheetData, Texture } from 'pixi.js';
import { assetImageFallbackUrl, isAssetJsonUrl } from './AssetJsonUrl';
import { GraphicAssetCollection } from './GraphicAssetCollection';
import { detectImageFormat, ImageLoadRequest, LoadedImageResource, loadImageResource, normalizedSourceExtension } from './image';
import avatarAdditionsAssetData from './assets/avatar_additions/avatar_additions.asset.json';
import placeHolderAssetData from './assets/place_holder/place_holder.asset.json';
import placeHolderPetAssetData from './assets/place_holder_pet/place_holder_pet.asset.json';
import placeHolderWallAssetData from './assets/place_holder_wall/place_holder_wall.asset.json';
import roomAssetData from './assets/room/room.asset.json';
import selectionArrowAssetData from './assets/selection_arrow/selection_arrow.asset.json';
import tileCursorAssetData from './assets/tile_cursor/tile_cursor.asset.json';

/** Bundles of an asset json and its sheet: Octane's .nitro and Habbo's .hab. */
const isBundleExtension = (extension: string): boolean => extension === 'nitro' || extension === 'hab';

/** Waits before each retry of a failed download; a 4xx other than 408/429 is not retried. */
const FETCH_RETRY_DELAYS_MS = [ 500, 1500 ];

const isRetryableStatus = (status: number): boolean => (status === 408) || (status === 429) || (status >= 500);

export interface AssetManagerDependencies
{
    fetch(url: string): Promise<Response>;
    wait?(ms: number): Promise<void>;
    parseAssetData(response: Response, source: string): Promise<IAssetData>;
    loadImageResource(request: ImageLoadRequest): Promise<LoadedImageResource>;
    loadOctaneBundle(buffer: ArrayBuffer, textureDecoder: OctaneBundleTextureDecoder): Promise<OctaneBundle>;
}

const DEFAULT_DEPENDENCIES: AssetManagerDependencies = {
    fetch: url => globalThis.fetch(url),
    parseAssetData: (response, source) => parseConfigJsonFromResponse<IAssetData>(response, source),
    loadImageResource,
    loadOctaneBundle: (buffer, textureDecoder) => OctaneBundle.from(buffer, textureDecoder)
};

export class AssetManager implements IAssetManager
{
    private _textures: Map<string, Texture> = new Map();
    private _collections: Map<string, IGraphicAssetCollection> = new Map();
    // Asset name -> the collections holding it. getAsset used to scan every loaded
    // collection (hundreds of furni libraries) on each lookup; registration order
    // still decides which collection wins, as the Map iteration did.
    private _assetIndex: Map<string, Set<GraphicAssetCollection>> = new Map();
    private _collectionOrder: WeakMap<GraphicAssetCollection, number> = new WeakMap();
    private _nextCollectionOrder: number = 0;
    private _imageResources: Map<string, LoadedImageResource> = new Map();
    // The image resource key whose sheet a downloaded collection was cut from.
    private _collectionSources: WeakMap<GraphicAssetCollection, string> = new WeakMap();
    private _downloads: Map<string, Promise<boolean>> = new Map();
    // Bumped on every change to the asset index, so lookups cached elsewhere know when to start over.
    private _assetRevision: number = 0;
    // The room's landscape images, decoded after the rest of the room library; settles once they are in.
    private _deferredRoomAssets: Promise<void> = Promise.resolve();

    constructor(private readonly _dependencies: AssetManagerDependencies = DEFAULT_DEPENDENCIES)
    {
    }

    public getTexture(name: string): Texture
    {
        if(!name) return null;

        return this._textures.get(name);
    }

    public setTexture(name: string, texture: Texture): void
    {
        if(!name || !texture) return;

        texture.label = name;

        this._textures.set(name, texture);
    }

    public getAsset(name: string): IGraphicAsset
    {
        if(!name) return null;

        const candidates = this._assetIndex.get(name);

        if(!candidates) return null;

        let first: GraphicAssetCollection = null;
        let firstOrder = Infinity;

        for(const collection of candidates)
        {
            if(this._collections.get(collection.name) !== collection) continue;

            const order = this._collectionOrder.get(collection);

            if(order >= firstOrder) continue;

            first = collection;
            firstOrder = order;
        }

        return first?.getAsset(name) ?? null;
    }

    /** Settles once the room library's landscape images, decoded after the boot, are in. */
    public whenRoomAssetsReady(): Promise<void>
    {
        return this._deferredRoomAssets;
    }

    public get assetRevision(): number
    {
        return this._assetRevision;
    }

    private assetChanged(collection: GraphicAssetCollection, name: string, added: boolean): void
    {
        this._assetRevision++;

        let candidates = this._assetIndex.get(name);

        if(added)
        {
            if(!candidates) this._assetIndex.set(name, candidates = new Set());

            candidates.add(collection);
        }
        else if(candidates)
        {
            candidates.delete(collection);

            if(!candidates.size) this._assetIndex.delete(name);
        }
    }

    public addAssetToCollection(collectionName: string, assetName: string, texture: Texture, override: boolean = true): boolean
    {
        const collection = this.getCollection(collectionName);

        if(!collection) return false;

        return collection.addAsset(assetName, texture, override, 0, 0, false, false);
    }

    public getCollection(name: string): IGraphicAssetCollection
    {
        if(!name) return null;

        return this._collections.get(name) ?? null;
    }

    public createCollection(data: IAssetData, spritesheet: Spritesheet): IGraphicAssetCollection
    {
        if(!data) return null;

        const collection = new GraphicAssetCollection(data, spritesheet);

        for(const [name, texture] of collection.textures.entries()) this.setTexture(name, texture);

        // A collection replacing one of the same name keeps its place in the order, like a Map key.
        const replaced = this._collections.get(collection.name) as GraphicAssetCollection;

        this._collectionOrder.set(collection, replaced ? this._collectionOrder.get(replaced) : this._nextCollectionOrder++);

        if(replaced)
        {
            replaced.onAssetChanged = null;

            for(const name of replaced.assetNames) this.assetChanged(replaced, name, false);

            this.releaseReplacedCollection(replaced);
        }

        this._collections.set(collection.name, collection);

        for(const name of collection.assetNames) this.assetChanged(collection, name, true);

        collection.onAssetChanged = (name, added) => this.assetChanged(collection, name, added);

        return collection;
    }

    // A collection replaced by one of the same name kept its textures registered and its sheet loaded for the session.
    private releaseReplacedCollection(replaced: GraphicAssetCollection): void
    {
        for(const [name, texture] of replaced.textures)
        {
            if(this._textures.get(name) === texture) this._textures.delete(name);
        }

        const source = this._collectionSources.get(replaced);

        if(source === undefined) return;

        this._collectionSources.delete(replaced);

        const resource = this._imageResources.get(source);

        if(!resource) return;

        this._imageResources.delete(source);

        if(this._textures.get(source) === resource.texture) this._textures.delete(source);

        resource.dispose();
    }

    public async downloadAssets(urls: string[]): Promise<boolean>
    {
        if(!urls || !urls.length) return Promise.resolve(true);

        await Promise.all(urls.map(url => this.downloadAsset(url)));

        return true;
    }

    public downloadAsset(url: string): Promise<boolean>
    {
        // Callers asking for the same url share one download, so a texture in use is never replaced by a copy.
        const existing = this._downloads.get(url);

        if(existing !== undefined) return existing;

        const download = this.loadAsset(url).finally(() => this._downloads.delete(url));

        this._downloads.set(url, download);

        return download;
    }

    private async loadAsset(url: string): Promise<boolean>
    {
        try
        {
            if(!url?.length) return false;

            if(url.startsWith('local://')) return this.downloadLocalAsset(url);

            // A .hab with the same json and sheet as a .nitro is read by the same bundle reader.
            if(isBundleExtension(normalizedSourceExtension(url)))
            {
                const buffer = await this.fetchBundleBuffer(url);
                const decodedResources: LoadedImageResource[] = [];

                try
                {
                    const octaneBundle = await this._dependencies.loadOctaneBundle(
                        buffer,
                        async (bytes, entryName) =>
                        {
                            const detected = detectImageFormat(new Uint8Array(bytes), undefined, entryName);

                            if(detected.format === 'svg')
                                throw new Error(`SVG texture entry "${ entryName }" is not supported inside a Octane bundle`);

                            const resource = await this._dependencies.loadImageResource({
                                source: entryName,
                                bytes,
                                allowAnimation: false
                            });

                            decodedResources.push(resource);

                            return pinPixelArtSampling(resource.texture);
                        });

                    const collection = await this.processAsset(octaneBundle.texture, octaneBundle.jsonFile);

                    const retainedResource = decodedResources.pop();

                    for(const resource of decodedResources) resource.dispose();
                    if(retainedResource) this.setImageResource(url, retainedResource);
                    this.setCollectionSource(collection, url);
                }
                catch (error)
                {
                    for(const resource of decodedResources) resource.dispose();
                    throw error;
                }
            }
            else if(isAssetJsonUrl(url))
            {
                const response = await this.fetchAsset(url);
                let data: IAssetData;

                try
                {
                    data = await this._dependencies.parseAssetData(response, url);
                }
                catch (error)
                {
                    throw new Error(`Invalid asset data "${ url }" - JSON/JSONC parse failed (${ errorMessage(error) })`);
                }

                const imagePath = data?.spritesheet?.meta?.image;
                const resolvedImageUrl = imagePath
                    ? new URL(imagePath, url).toString()
                    : assetImageFallbackUrl(url, data?.name);
                const resource = await this._dependencies.loadImageResource({
                    source: resolvedImageUrl,
                    allowAnimation: false
                });

                try
                {
                    const collection = await this.processAsset(pinPixelArtSampling(resource.texture), data);
                    this.setImageResource(url, resource);
                    this.setCollectionSource(collection, url);
                }
                catch (error)
                {
                    resource.dispose();
                    throw error;
                }
            }
            else
            {
                const resource = await this._dependencies.loadImageResource({ source: url });

                this.setImageResource(url, resource);
            }

            return true;
        }
        catch (error)
        {
            throw new Error(`Asset loading failed for "${ url }": ${ errorMessage(error) }`);
        }
    }

    private async downloadLocalAsset(url: string): Promise<boolean>
    {
        const key = url.substring('local://'.length);

        switch(key)
        {
            case 'room':
                await this.loadLocalRoom();
                return true;
            case 'place_holder':
            case 'place_holder_wall':
            case 'place_holder_pet':
            case 'tile_cursor':
            case 'selection_arrow':
            case 'avatar_additions':
            case 'floor_editor':
            case 'variablefx':
                await this.loadLocalAsset(key);
                return true;
            default:
                return false;
        }
    }

    /** Only the browser's own fetch is replaced by what the page prefetched: an injected one sees every request. */
    private get usesDefaultFetch(): boolean
    {
        return (this._dependencies.fetch === DEFAULT_DEPENDENCIES.fetch);
    }

    /** A bundle's bytes: the ones the page already downloaded when it did, otherwise fetched. */
    private async fetchBundleBuffer(url: string): Promise<ArrayBuffer>
    {
        if(this.usesDefaultFetch)
        {
            const prefetched = await takePrefetchedBuffer(url);

            if(prefetched) return prefetched;
        }

        const response = await this.fetchAsset(url);

        return response.arrayBuffer();
    }

    private async fetchAsset(url: string): Promise<Response>
    {
        // The first try may be the page's own early request for this address; a retry always fetches anew.
        let prefetched = this.usesDefaultFetch ? takePrefetchedResponse(url) : null;

        for(let attempt = 0; ; attempt++)
        {
            const canRetry = (attempt < FETCH_RETRY_DELAYS_MS.length);
            let response: Response;

            try
            {
                const request = prefetched ?? this._dependencies.fetch(url);

                prefetched = null;
                response = await request;
            }
            catch (error)
            {
                if(!canRetry) throw new Error(`Could not fetch "${ url }" - is the URL correct and the server reachable? (${ errorMessage(error) })`);
            }

            if(response?.ok) return response;

            if(!canRetry || (response && !isRetryableStatus(response.status))) throw new Error(`Failed to load "${ url }" - server returned HTTP ${ response?.status ?? 'no response' }`);

            await this.wait(FETCH_RETRY_DELAYS_MS[attempt]);
        }
    }

    private wait(ms: number): Promise<void>
    {
        if(this._dependencies.wait) return this._dependencies.wait(ms);

        return new Promise(resolve => setTimeout(resolve, ms));
    }

    private setImageResource(key: string, resource: LoadedImageResource): void
    {
        const existing = this._imageResources.get(key);

        if(existing && existing !== resource) existing.dispose();

        this._imageResources.set(key, resource);
        this.setTexture(key, resource.texture);
    }

    private setCollectionSource(collection: IGraphicAssetCollection, key: string): void
    {
        if(collection instanceof GraphicAssetCollection) this._collectionSources.set(collection, key);
    }

    private async loadLocalRoom(): Promise<void>
    {
        const roomData = roomAssetData as unknown as IAssetData;
        const collection = this.createCollection(roomData, null) as GraphicAssetCollection;
        if(!collection) return;

        const roomImages = import.meta.glob('./assets/room/*.{png,jpg,jpeg,gif,webp,avif,svg,bmp}', { eager: true });
        const roomImagesSub = import.meta.glob('./assets/room/images/*.{png,jpg,jpeg,gif,webp,avif,svg,bmp}', { eager: true });
        const merged = { ...roomImages, ...roomImagesSub };

        const loadEntry = async (path: string): Promise<void> =>
        {
            const mod = merged[path];
            const imageUrl = ((mod as { default?: string }).default ?? mod) as string;
            const rawName = imageNameFromPath(path);
            const resource = await this._dependencies.loadImageResource({ source: imageUrl, allowAnimation: false });
            const texture = resource.texture;

            if(!texture)
            {
                resource.dispose();
                return;
            }

            this.setImageResource(imageUrl, resource);
            this.setTexture(rawName, texture);
            collection.textures.set(rawName, texture);

            if(rawName.startsWith('room_'))
            {
                const normalizedName = rawName.substring('room_'.length);
                this.setTexture(normalizedName, texture);
                collection.textures.set(normalizedName, texture);
            }
        };

        const eagerPaths: string[] = [];
        const deferredPaths: string[] = [];

        // The landscape images (about 40) are not needed to finish the boot; they are decoded right after it.
        // The small window and door masks stay in the first pass, so the plane masks are complete for the first room.
        for(const path of Object.keys(merged)) (imageNameFromPath(path).includes('landscape_') ? deferredPaths : eagerPaths).push(path);

        await Promise.all(eagerPaths.map(loadEntry));

        collection.define(roomData);

        if(deferredPaths.length) this._deferredRoomAssets = this.loadDeferredRoomAssets(collection, roomData, deferredPaths, loadEntry);
    }

    private loadDeferredRoomAssets(collection: GraphicAssetCollection, roomData: IAssetData, paths: string[], loadEntry: (path: string) => Promise<void>): Promise<void>
    {
        return new Promise<void>(resolve =>
        {
            setTimeout(() =>
            {
                void Promise.allSettled(paths.map(loadEntry))
                    .then(results =>
                    {
                        results.forEach((result, index) =>
                        {
                            if(result.status === 'rejected') OctaneLogger.warn(`[AssetManager] Failed to load deferred room asset "${ paths[index] }"`, result.reason);
                        });

                        // Only the assets that are new now: defining an existing flipped door or window asset again
                        // would replace and recycle it.
                        const missingAssets: { [index: string]: IAsset } = {};

                        for(const [assetName, assetDef] of Object.entries(roomData.assets || {}))
                        {
                            if(!collection.getAsset(assetName)) missingAssets[assetName] = assetDef;
                        }

                        if(Object.keys(missingAssets).length) collection.define({ ...roomData, assets: missingAssets, palettes: undefined });
                    })
                    .finally(resolve);
            }, 0);
        });
    }

    private async loadLocalAsset(name: string): Promise<void>
    {
        let dataModule: { default?: IAssetData } | IAssetData;

        switch(name)
        {
            case 'place_holder':
                dataModule = placeHolderAssetData;
                break;
            case 'place_holder_wall':
                dataModule = placeHolderWallAssetData;
                break;
            case 'place_holder_pet':
                dataModule = placeHolderPetAssetData;
                break;
            case 'tile_cursor':
                dataModule = tileCursorAssetData;
                break;
            case 'selection_arrow':
                dataModule = selectionArrowAssetData;
                break;
            case 'avatar_additions':
                dataModule = avatarAdditionsAssetData;
                break;
            case 'floor_editor':
                dataModule = await import('./assets/floor_editor/floor_editor.asset.json');
                break;
            case 'variablefx':
                dataModule = await import('./assets/variablefx/variablefx.asset.json');
                break;
            default:
                return;
        }

        const data = ('default' in dataModule ? dataModule.default : dataModule) as IAssetData;
        const collection = this.createCollection(data, null) as GraphicAssetCollection;
        if(!collection) return;

        const allImages = import.meta.glob('./assets/*/images/*.{png,jpg,jpeg,gif,webp,avif,svg,bmp}', { eager: true });
        const prefix = `./assets/${ name }/images/`;

        await Promise.all(Object.keys(allImages).filter(path => path.startsWith(prefix)).map(async path =>
        {
            const mod = allImages[path];
            const imageUrl = ((mod as { default?: string }).default ?? mod) as string;
            const rawName = imageNameFromPath(path);
            const resource = await this._dependencies.loadImageResource({ source: imageUrl, allowAnimation: false });
            const texture = resource.texture;

            if(!texture)
            {
                resource.dispose();
                return;
            }

            this.setImageResource(imageUrl, resource);
            this.setTexture(rawName, texture);
            collection.textures.set(name + '_' + rawName, texture);
            collection.textures.set(rawName, texture);
        }));

        collection.define(data);
    }

    private async processAsset(texture: Texture, data: IAssetData): Promise<IGraphicAssetCollection>
    {
        let spritesheet: Spritesheet<SpritesheetData> = null;

        if(texture && data?.spritesheet && Object.keys(data.spritesheet).length)
        {
            spritesheet = new Spritesheet(texture, data.spritesheet);

            // All frames at once: parse() splits a sheet of over 1000 frames into timer-separated batches.
            spritesheet.parseSync();

            spritesheet.textureSource.label = data.name ?? null;
        }

        return this.createCollection(data, spritesheet);
    }

    public get collections(): Map<string, IGraphicAssetCollection>
    {
        return this._collections;
    }
}

const pinPixelArtSampling = (texture: Texture): Texture =>
{
    const source = texture?.source as (Texture['source'] & { octaneFixedScaleMode?: boolean }) | undefined;

    if(!source) return texture;

    source.scaleMode = 'nearest';
    source.octaneFixedScaleMode = true;

    return texture;
};

const imageNameFromPath = (path: string): string =>
{
    const fileName = path.split('/').pop() ?? path;

    return fileName.replace(/\.(?:png|jpe?g|gif|webp|avif|svg|bmp)$/i, '');
};

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);
