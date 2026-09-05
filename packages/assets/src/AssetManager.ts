import { IAssetData, IAssetManager, IGraphicAsset, IGraphicAssetCollection } from '@octane/api';
import { OctaneBundle, OctaneBundleTextureDecoder, parseConfigJsonFromResponse } from '@octane/utils';
import { Spritesheet, SpritesheetData, Texture } from 'pixi.js';
import { assetImageFallbackUrl, isAssetJsonUrl } from './AssetJsonUrl';
import { GraphicAssetCollection } from './GraphicAssetCollection';
import { detectImageFormat, ImageLoadRequest, LoadedImageResource, loadImageResource, normalizedSourceExtension } from './image';

export interface AssetManagerDependencies
{
    fetch(url: string): Promise<Response>;
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
    private _missingAssetNames: Set<string> = new Set();
    private _imageResources: Map<string, LoadedImageResource> = new Map();

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

        if(this._missingAssetNames.has(name)) return null;

        for(const collection of this._collections.values())
        {
            if(!collection) continue;

            const existing = collection.getAsset(name);

            if(!existing) continue;

            return existing;
        }

        this._missingAssetNames.add(name);

        return null;
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

        this._collections.set(collection.name, collection);

        if(this._missingAssetNames.size > 0) this._missingAssetNames.clear();

        return collection;
    }

    public async downloadAssets(urls: string[]): Promise<boolean>
    {
        if(!urls || !urls.length) return Promise.resolve(true);

        await Promise.all(urls.map(url => this.downloadAsset(url)));

        return true;
    }

    public async downloadAsset(url: string): Promise<boolean>
    {
        try
        {
            if(!url?.length) return false;

            if(url.startsWith('local://')) return this.downloadLocalAsset(url);

            if(normalizedSourceExtension(url) === 'nitro')
            {
                const response = await this.fetchAsset(url);
                const decodedResources: LoadedImageResource[] = [];

                try
                {
                    const octaneBundle = await this._dependencies.loadOctaneBundle(
                        await response.arrayBuffer(),
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

                            return resource.texture;
                        });

                    await this.processAsset(octaneBundle.texture, octaneBundle.jsonFile);

                    const retainedResource = decodedResources.pop();

                    for(const resource of decodedResources) resource.dispose();
                    if(retainedResource) this.setImageResource(url, retainedResource);
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
                    await this.processAsset(resource.texture, data);
                    this.setImageResource(url, resource);
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
            case 'group_badge':
                await this.loadLocalAsset(key);
                return true;
            default:
                return false;
        }
    }

    private async fetchAsset(url: string): Promise<Response>
    {
        let response: Response;

        try
        {
            response = await this._dependencies.fetch(url);
        }
        catch (error)
        {
            throw new Error(`Could not fetch "${ url }" - is the URL correct and the server reachable? (${ errorMessage(error) })`);
        }

        if(!response?.ok) throw new Error(`Failed to load "${ url }" - server returned HTTP ${ response?.status ?? 'no response' }`);

        return response;
    }

    private setImageResource(key: string, resource: LoadedImageResource): void
    {
        const existing = this._imageResources.get(key);

        if(existing && existing !== resource) existing.dispose();

        this._imageResources.set(key, resource);
        this.setTexture(key, resource.texture);
    }

    private async loadLocalRoom(): Promise<void>
    {
        const roomDataModule = await import('./assets/room/room.asset.json');
        const roomData = (roomDataModule.default ?? roomDataModule) as IAssetData;
        const collection = this.createCollection(roomData, null) as GraphicAssetCollection;
        if(!collection) return;

        const roomImages = import.meta.glob('./assets/room/*.{png,jpg,jpeg,gif,webp,avif,svg,bmp}', { eager: true });
        const roomImagesSub = import.meta.glob('./assets/room/images/*.{png,jpg,jpeg,gif,webp,avif,svg,bmp}', { eager: true });
        const merged = { ...roomImages, ...roomImagesSub };

        for(const path in merged)
        {
            const mod = merged[path];
            const imageUrl = ((mod as { default?: string }).default ?? mod) as string;
            const rawName = imageNameFromPath(path);
            const resource = await this._dependencies.loadImageResource({ source: imageUrl, allowAnimation: false });
            const texture = resource.texture;

            if(!texture)
            {
                resource.dispose();
                continue;
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
        }

        collection.define(roomData);
    }

    private async loadLocalAsset(name: string): Promise<void>
    {
        let dataModule: { default?: IAssetData } | IAssetData;

        switch(name)
        {
            case 'place_holder':
                dataModule = await import('./assets/place_holder/place_holder.asset.json');
                break;
            case 'place_holder_wall':
                dataModule = await import('./assets/place_holder_wall/place_holder_wall.asset.json');
                break;
            case 'place_holder_pet':
                dataModule = await import('./assets/place_holder_pet/place_holder_pet.asset.json');
                break;
            case 'tile_cursor':
                dataModule = await import('./assets/tile_cursor/tile_cursor.asset.json');
                break;
            case 'selection_arrow':
                dataModule = await import('./assets/selection_arrow/selection_arrow.asset.json');
                break;
            case 'avatar_additions':
                dataModule = await import('./assets/avatar_additions/avatar_additions.asset.json');
                break;
            case 'floor_editor':
                dataModule = await import('./assets/floor_editor/floor_editor.asset.json');
                break;
            case 'group_badge':
                dataModule = await import('./assets/group_badge/group_badge.asset.json');
                break;
            default:
                return;
        }

        const data = ('default' in dataModule ? dataModule.default : dataModule) as IAssetData;
        const collection = this.createCollection(data, null) as GraphicAssetCollection;
        if(!collection) return;

        const allImages = import.meta.glob('./assets/*/images/*.{png,jpg,jpeg,gif,webp,avif,svg,bmp}', { eager: true });
        const prefix = `./assets/${ name }/images/`;

        for(const path in allImages)
        {
            if(!path.startsWith(prefix)) continue;

            const mod = allImages[path];
            const imageUrl = ((mod as { default?: string }).default ?? mod) as string;
            const rawName = imageNameFromPath(path);
            const resource = await this._dependencies.loadImageResource({ source: imageUrl, allowAnimation: false });
            const texture = resource.texture;

            if(!texture)
            {
                resource.dispose();
                continue;
            }

            this.setImageResource(imageUrl, resource);
            this.setTexture(rawName, texture);
            collection.textures.set(name + '_' + rawName, texture);
            collection.textures.set(rawName, texture);
        }

        collection.define(data);
    }

    private async processAsset(texture: Texture, data: IAssetData): Promise<IGraphicAssetCollection>
    {
        let spritesheet: Spritesheet<SpritesheetData> = null;

        if(texture && data?.spritesheet && Object.keys(data.spritesheet).length)
        {
            spritesheet = new Spritesheet(texture, data.spritesheet);

            await spritesheet.parse();

            spritesheet.textureSource.label = data.name ?? null;
        }

        return this.createCollection(data, spritesheet);
    }

    public get collections(): Map<string, IGraphicAssetCollection>
    {
        return this._collections;
    }
}

const imageNameFromPath = (path: string): string =>
{
    const fileName = path.split('/').pop() ?? path;

    return fileName.replace(/\.(?:png|jpe?g|gif|webp|avif|svg|bmp)$/i, '');
};

const errorMessage = (error: unknown): string => error instanceof Error ? error.message : String(error);
