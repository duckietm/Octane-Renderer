import { FurnitureType, IEventDispatcher, IFurnitureData, IGraphicAssetCollection, IPetColorResult, IRoomContentListener, IRoomContentLoader, IRoomObject, RoomObjectCategory, RoomObjectUserType, RoomObjectVariable, RoomObjectVisualizationType } from '@octane/api';
import { GetAssetManager } from '@octane/assets';
import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher, RoomContentLoadedEvent } from '@octane/events';
import { GetSessionDataManager } from '@octane/session';
import { OctaneLogger } from '@octane/utils';
import { Texture } from 'pixi.js';
import { PetColorResult } from './PetColorResult';

export class RoomContentLoader implements IRoomContentLoader
{
    private static PLACE_HOLDER: string = 'place_holder';
    private static PLACE_HOLDER_WALL: string = 'place_holder_wall';
    private static PLACE_HOLDER_PET: string = 'place_holder_pet';
    private static PLACE_HOLDER_DEFAULT: string = RoomContentLoader.PLACE_HOLDER;
    private static ROOM: string = 'room';
    private static LANDSCAPE: string = 'landscape';
    private static TILE_CURSOR: string = 'tile_cursor';
    private static SELECTION_ARROW: string = 'selection_arrow';
    private static AVATAR_ADDITIONS: string = 'avatar_additions';
    private static FLOOR_EDITOR: string = 'floor_editor';
    /** AIR's variable fx bars, hearts, badges, numbers and icons (the room visualization library's variablefx assets). */
    private static VARIABLE_FX: string = 'variablefx';

    public static MANDATORY_LIBRARIES: string[] = [RoomContentLoader.PLACE_HOLDER, RoomContentLoader.PLACE_HOLDER_WALL, RoomContentLoader.PLACE_HOLDER_PET, RoomContentLoader.ROOM, RoomContentLoader.LANDSCAPE, RoomContentLoader.TILE_CURSOR, RoomContentLoader.SELECTION_ARROW, RoomContentLoader.AVATAR_ADDITIONS, RoomContentLoader.FLOOR_EDITOR, RoomContentLoader.VARIABLE_FX];

    private _iconListener: IRoomContentListener;
    private _images: Map<string, HTMLImageElement> = new Map();
    // Downloads on their way, with every object waiting for each: the same image was downloaded once per request.
    private _imageWaiters: Map<string, number[]> = new Map();
    // The image cache kept every downloaded image for the whole session.
    private static readonly MAX_CACHED_IMAGES = 500;

    private _activeObjects: { [index: string]: number } = {};
    private _activeObjectTypes: Map<number, string> = new Map();
    private _activeObjectTypeIds: Map<string, number> = new Map();
    private _objectTypeAdUrls: Map<string, string> = new Map();
    private _wallItems: { [index: string]: number } = {};
    private _wallItemTypes: Map<number, string> = new Map();
    private _wallItemTypeIds: Map<string, number> = new Map();
    private _furniRevisions: Map<string, number> = new Map();
    private _pets: { [index: string]: number } = {};
    private _petColors: Map<number, Map<number, IPetColorResult>> = new Map();
    private _objectAliases: Map<string, string> = new Map();
    private _objectOriginalNames: Map<string, string> = new Map();

    private _pendingContentTypes: string[] = [];

    public async init(): Promise<void>
    {
        this.processFurnitureData(GetSessionDataManager().getAllFurnitureData());

        for(const [index, name] of (GetConfiguration().getValue<string[]>('pet.types') ?? []).entries()) this._pets[name] = index;

        // One library that fails to load must not stop the room engine; its objects show placeholders.
        const results = await Promise.allSettled(RoomContentLoader.MANDATORY_LIBRARIES.map(value => this.downloadAsset(value)));

        results.forEach((result, index) =>
        {
            if(result.status === 'rejected') OctaneLogger.error(`Room library "${ RoomContentLoader.MANDATORY_LIBRARIES[index] }" failed to load`, result.reason);
        });
    }

    public processFurnitureData(furnitureData: IFurnitureData[]): void
    {
        if(!furnitureData) return;

        for(const furniture of furnitureData)
        {
            if(!furniture) continue;

            const id = furniture.id;

            let className = furniture.className;

            if(furniture.hasIndexedColor) className = ((className + '*') + furniture.colorIndex);

            const revision = furniture.revision;
            const adUrl = furniture.adUrl;

            if(adUrl && adUrl.length > 0) this._objectTypeAdUrls.set(className, adUrl);

            let name = furniture.className;

            if(furniture.type === FurnitureType.FLOOR)
            {
                this._activeObjectTypes.set(id, className);
                this._activeObjectTypeIds.set(className, id);

                if(!this._activeObjects[name]) this._activeObjects[name] = 1;
            }

            else if(furniture.type === FurnitureType.WALL)
            {
                if(name === 'post.it')
                {
                    className = 'post_it';
                    name = 'post_it';
                }

                if(name === 'post.it.vd')
                {
                    className = 'post_it_vd';
                    name = 'post_id_vd';
                }

                this._wallItemTypes.set(id, className);
                this._wallItemTypeIds.set(className, id);

                if(!this._wallItems[name]) this._wallItems[name] = 1;

                const normalizedName = this.removeColorIndex(className);

                if(normalizedName && !this._wallItems[normalizedName]) this._wallItems[normalizedName] = 1;
            }

            const existingRevision = this._furniRevisions.get(name);

            if(revision > existingRevision)
            {
                this._furniRevisions.delete(name);
                this._furniRevisions.set(name, revision);
            }
        }
    }

    public getFurnitureFloorNameForTypeId(typeId: number): string
    {
        const type = this._activeObjectTypes.get(typeId);

        return this.removeColorIndex(type);
    }

    public getFurnitureWallNameForTypeId(typeId: number, extra: string = null): string
    {
        let type = this._wallItemTypes.get(typeId);

        if((type === 'poster') && (extra !== null)) type = (type + extra);

        return this.removeColorIndex(type);
    }

    public getFurnitureFloorColorIndex(typeId: number): number
    {
        const type = this._activeObjectTypes.get(typeId);

        if(!type) return -1;

        return this.getColorIndexFromName(type);
    }

    public getFurnitureWallColorIndex(typeId: number): number
    {
        const type = this._wallItemTypes.get(typeId);

        if(!type) return -1;

        return this.getColorIndexFromName(type);
    }

    private getColorIndexFromName(name: string): number
    {
        if(!name) return -1;

        const index = name.indexOf('*');

        if(index === -1) return 0;

        return parseInt(name.substr(index + 1));
    }

    private removeColorIndex(name: string): string
    {
        if(!name) return null;

        const index = name.indexOf('*');

        if(index === -1) return name;

        return name.substr(0, index);
    }

    public getRoomObjectAdUrl(type: string): string
    {
        const value = this._objectTypeAdUrls.get(type);

        if(!value) return '';

        return value;
    }

    public getPetColorResult(petIndex: number, paletteIndex: number): IPetColorResult
    {
        const colorResults = this._petColors.get(petIndex);

        if(!colorResults) return null;

        return colorResults.get(paletteIndex);
    }

    public getPetColorResultsForTag(petIndex: number, tagName: string): IPetColorResult[]
    {
        const colorResults = this._petColors.get(petIndex);
        const results: IPetColorResult[] = [];

        if(colorResults)
        {
            for(const result of colorResults.values())
            {
                if(result.tag === tagName) results.push(result);
            }
        }

        return results;
    }

    public getCollection(name: string): IGraphicAssetCollection
    {
        return GetAssetManager().getCollection(name);
    }

    public getImage(name: string): HTMLImageElement
    {
        if(!name) return null;

        const existing = this._images.get(name);

        if(!existing) return null;

        const image = new Image();

        image.src = existing.src;

        return image;
    }

    public addAssetToCollection(collectionName: string, assetName: string, texture: Texture, override: boolean = true): boolean
    {
        return GetAssetManager().addAssetToCollection(collectionName, assetName, texture, override);
    }

    public getPlaceholderName(type: string): string
    {
        const category = this.getCategoryForType(type);

        switch(category)
        {
            case RoomObjectCategory.FLOOR:
                return RoomContentLoader.PLACE_HOLDER;
            case RoomObjectCategory.WALL:
                return RoomContentLoader.PLACE_HOLDER_WALL;
            default:
                if(this._pets[type] !== undefined) return RoomContentLoader.PLACE_HOLDER_PET;

                return RoomContentLoader.PLACE_HOLDER_DEFAULT;
        }
    }

    public getCategoryForType(type: string): number
    {
        if(!type) return RoomObjectCategory.MINIMUM;

        if(this._wallItems[type] !== undefined) return RoomObjectCategory.WALL;

        if(this._activeObjects[type] !== undefined) return RoomObjectCategory.FLOOR;

        if(this._pets[type] !== undefined) return RoomObjectCategory.UNIT;

        if(type.indexOf('poster') === 0) return RoomObjectCategory.WALL;

        if(type === 'room') return RoomObjectCategory.ROOM;

        if(type === RoomObjectUserType.USER) return RoomObjectCategory.UNIT;

        if(type === RoomObjectUserType.PET) return RoomObjectCategory.UNIT;

        if(type === RoomObjectUserType.BOT) return RoomObjectCategory.UNIT;

        if(type === RoomObjectUserType.RENTABLE_BOT) return RoomObjectCategory.UNIT;

        if((type === RoomContentLoader.TILE_CURSOR) || (type === RoomContentLoader.SELECTION_ARROW)) return RoomObjectCategory.CURSOR;

        return RoomObjectCategory.MINIMUM;
    }

    public getPetNameForType(type: number): string
    {
        return (GetConfiguration().getValue<string[]>('pet.types') ?? [])[type] || null;
    }

    public isLoaderType(type: string): boolean
    {
        type = RoomObjectUserType.getRealType(type);

        if(type === RoomObjectVisualizationType.USER) return false;

        return true;
    }

    public downloadImage(id: number, type: string, param: string, events: IEventDispatcher = null): boolean
    {
        let typeName: string = null;
        let assetUrls: string[] = [];

        if(type && (type.indexOf(',') >= 0))
        {
            typeName = type;
            type = typeName.split(',')[0];
        }

        if(typeName)
        {
            assetUrls = this.getAssetUrls(typeName, param, true);
        }
        else
        {
            assetUrls = this.getAssetUrls(type, param, true);
        }

        if(assetUrls && assetUrls.length)
        {
            const url = assetUrls[0];
            const key = [ type, param ].join('_');
            const waiting = this._imageWaiters.get(key);

            if(waiting)
            {
                waiting.push(id);

                return true;
            }

            this._imageWaiters.set(key, [ id ]);

            const finish = (loaded: boolean) =>
            {
                const ids = this._imageWaiters.get(key) ?? [];

                this._imageWaiters.delete(key);

                for(const waitingId of ids) this._iconListener.onRoomContentLoaded(waitingId, key, loaded);
            };

            const image = new Image();

            image.src = url;

            image.onload = () =>
            {
                image.onerror = null;

                this._images.delete(key);
                this._images.set(key, image);

                while(this._images.size > RoomContentLoader.MAX_CACHED_IMAGES) this._images.delete(this._images.keys().next().value);

                finish(true);
            };

            image.onerror = () =>
            {
                image.onload = null;

                OctaneLogger.error('Failed to download asset', url);

                finish(false);
            };

            return true;
        }

        return false;
    }

    public downloadAssetSync(type: string): void
    {
        const assetUrl: string = this.getAssetUrls(type)?.[0];

        if(!assetUrl || !assetUrl.length) return;

        if((this._pendingContentTypes.indexOf(type) >= 0)) return;

        this._pendingContentTypes.push(type);

        GetAssetManager()
            .downloadAsset(assetUrl)
            .then(() =>
            {
                const petIndex = this._pets[type];

                if(petIndex !== undefined)
                {
                    const collection = this.getCollection(type);
                    const keys = collection.getPaletteNames();
                    const palettes: Map<number, IPetColorResult> = new Map();

                    for(const key of keys)
                    {
                        const palette = collection.getPalette(key);
                        const paletteData = collection.data.palettes[key];

                        const primaryColor = palette.primaryColor;
                        const secondaryColor = palette.secondaryColor;
                        const breed = ((paletteData.breed !== undefined) ? paletteData.breed : 0);
                        const tag = ((paletteData.colorTag !== undefined) ? paletteData.colorTag : -1);
                        const master = ((paletteData.master !== undefined) ? paletteData.master : false);
                        const layerTags = ((paletteData.tags !== undefined) ? paletteData.tags : []);

                        palettes.set(parseInt(key), new PetColorResult(primaryColor, secondaryColor, breed, tag, key, master, layerTags));
                    }

                    this._petColors.set(petIndex, palettes);
                }

                GetEventDispatcher().dispatchEvent(new RoomContentLoadedEvent(RoomContentLoadedEvent.RCLE_SUCCESS, type));
            })
            .catch((err) =>
            {
                this.clearPendingType(type);

                GetEventDispatcher().dispatchEvent(new RoomContentLoadedEvent(RoomContentLoadedEvent.RCLE_FAILURE, type));
            });
    }

    /** A failed type may be requested again later, instead of staying a placeholder until reload. */
    private clearPendingType(type: string): void
    {
        const index = this._pendingContentTypes.indexOf(type);

        if(index >= 0) this._pendingContentTypes.splice(index, 1);
    }

    public async downloadAsset(type: string): Promise<void>
    {
        const assetUrl: string = this.getAssetUrls(type)?.[0];

        if(!assetUrl || !assetUrl.length) return;

        if((this._pendingContentTypes.indexOf(type) >= 0)) return;

        this._pendingContentTypes.push(type);

        let downloaded = false;

        try
        {
            downloaded = await GetAssetManager().downloadAsset(assetUrl);
        }
        catch (error)
        {
            this.clearPendingType(type);

            GetEventDispatcher().dispatchEvent(new RoomContentLoadedEvent(RoomContentLoadedEvent.RCLE_FAILURE, type));

            throw error;
        }

        if(!downloaded)
        {
            this.clearPendingType(type);

            GetEventDispatcher().dispatchEvent(new RoomContentLoadedEvent(RoomContentLoadedEvent.RCLE_FAILURE, type));

            return;
        }

        const petIndex = this._pets[type];

        if(petIndex !== undefined)
        {
            const collection = this.getCollection(type);
            const keys = collection.getPaletteNames();
            const palettes: Map<number, IPetColorResult> = new Map();

            for(const key of keys)
            {
                const palette = collection.getPalette(key);
                const paletteData = collection.data.palettes[key];

                const primaryColor = palette.primaryColor;
                const secondaryColor = palette.secondaryColor;
                const breed = ((paletteData.breed !== undefined) ? paletteData.breed : 0);
                const tag = ((paletteData.colorTag !== undefined) ? paletteData.colorTag : -1);
                const master = ((paletteData.master !== undefined) ? paletteData.master : false);
                const layerTags = ((paletteData.tags !== undefined) ? paletteData.tags : []);

                palettes.set(parseInt(key), new PetColorResult(primaryColor, secondaryColor, breed, tag, key, master, layerTags));
            }

            this._petColors.set(petIndex, palettes);
        }

        GetEventDispatcher().dispatchEvent(new RoomContentLoadedEvent(RoomContentLoadedEvent.RCLE_SUCCESS, type));
    }

    public getAssetAliasName(name: string): string
    {
        const existing = this._objectAliases.get(name);

        if(!existing) return name;

        return existing;
    }

    public setAssetAliasName(name: string, originalName: string): void
    {
        this._objectAliases.set(name, originalName);
        this._objectOriginalNames.set(originalName, name);
    }

    private getAssetOriginalName(name: string): string
    {
        const existing = this._objectOriginalNames.get(name);

        if(!existing) return name;

        return existing;
    }

    public getAssetUrls(type: string, param: string = null, icon: boolean = false): string[]
    {
        switch(type)
        {
            case RoomContentLoader.PLACE_HOLDER:
                return ['local://place_holder'];
            case RoomContentLoader.PLACE_HOLDER_WALL:
                return ['local://place_holder_wall'];
            case RoomContentLoader.PLACE_HOLDER_PET:
                return ['local://place_holder_pet'];
            case RoomContentLoader.ROOM:
                return ['local://room'];
            case RoomContentLoader.TILE_CURSOR:
                return ['local://tile_cursor'];
            case RoomContentLoader.SELECTION_ARROW:
                return ['local://selection_arrow'];
            case RoomContentLoader.AVATAR_ADDITIONS:
                return ['local://avatar_additions'];
            case RoomContentLoader.FLOOR_EDITOR:
                return ['local://floor_editor'];
            case RoomContentLoader.VARIABLE_FX:
                return ['local://variablefx'];
            default: {
                const category = this.getCategoryForType(type);

                if((category === RoomObjectCategory.FLOOR) || (category === RoomObjectCategory.WALL))
                {
                    const name = this.getAssetAliasName(type);

                    let assetUrl = (icon ? this.getAssetUrlWithFurniIconBase(name) : this.getAssetUrlWithFurniBase(type));

                    if(icon)
                    {
                        const active = (param && (param !== '') && (this._activeObjectTypeIds.has((name + '*' + param))));

                        assetUrl = (assetUrl.replace(/%param%/gi, (active ? ('_' + param) : '')));
                    }

                    return [assetUrl];
                }

                if(category === RoomObjectCategory.UNIT)
                {
                    return [this.getAssetUrlWithPetBase(type)];
                }

                return null;
            }
        }
    }

    public getAssetIconUrl(type: string, colorIndex: string): string
    {
        let assetName: string = null;
        let assetUrls: string[] = [];

        if(type && (type.indexOf(',') >= 0))
        {
            assetName = type;

            type = assetName.split(',')[0];
        }

        if(assetName)
        {
            assetUrls = this.getAssetUrls(assetName, colorIndex, true);
        }
        else
        {
            assetUrls = this.getAssetUrls(type, colorIndex, true);
        }

        if(assetUrls && assetUrls.length) return assetUrls[0];

        return null;
    }

    public getAssetUrlWithFurniBase(assetName: string): string
    {
        return (GetConfiguration().getValue<string>('furni.asset.url').replace(/%libname%/gi, assetName));
    }

    public getAssetUrlWithFurniIconBase(assetName: string): string
    {
        return (GetConfiguration().getValue<string>('furni.asset.icon.url').replace(/%libname%/gi, assetName));
    }

    public getAssetUrlWithPetBase(assetName: string): string
    {
        return (GetConfiguration().getValue<string>('pet.asset.url').replace(/%libname%/gi, assetName));
    }

    public setRoomObjectRoomId(object: IRoomObject, roomId: string): void
    {
        const model = object && object.model;

        if(!model) return;

        model.setValue(RoomObjectVariable.OBJECT_ROOM_ID, roomId);
    }

    public setIconListener(listener: IRoomContentListener): void
    {
        this._iconListener = listener;
    }

    public get pets(): { [index: string]: number }
    {
        return this._pets;
    }
}
