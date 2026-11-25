import { FurnitureType, IFurnitureData } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { GetLocalizationManager } from '@octane/localization';
import { loadGamedata } from '@octane/utils';
import { FurnitureData } from './FurnitureData';

export class FurnitureDataLoader
{
    private _floorItems: Map<number, IFurnitureData>;
    private _wallItems: Map<number, IFurnitureData>;

    constructor(floorItems: Map<number, IFurnitureData>, wallItems: Map<number, IFurnitureData>)
    {
        this._floorItems = floorItems;
        this._wallItems = wallItems;
    }

    /**
     * Loads the furnidata. With lazyLocalization the names and descriptions are not copied into the
     * localization: it reads them from the furniture data on demand (see SessionDataManager).
     */
    public async init(lazyLocalization: boolean = false): Promise<void>
    {
        const url = GetConfiguration().getValue<string>('furnidata.url');

        if(!url || !url.length) throw new Error('Missing "furnidata.url" in config — add the furniture data URL to your renderer-config.json');

        let responseData: any;

        try
        {
            responseData = await loadGamedata(url);
        }
        catch (err)
        {
            throw new Error(`Could not load furniture data from "${ url }" — check "furnidata.url" in renderer-config.json (${ err?.message || err })`);
        }

        if(responseData.roomitemtypes) this.parseFloorItems(responseData.roomitemtypes, !lazyLocalization, false);

        if(responseData.wallitemtypes) this.parseWallItems(responseData.wallitemtypes, !lazyLocalization, false);
    }

    // Reload a furniture-data chunk such as custom/imported.jsonc and merge it
    // into the existing maps. Returned entries let RoomContentLoader update
    // without a full client reload.
    public async mergeFromUrl(url: string, updateLocalization: boolean = true): Promise<IFurnitureData[]>
    {
        if(!url || !url.length) return [];

        let responseData: any;

        try
        {
            responseData = await loadGamedata(url);
        }
        catch (err)
        {
            return [];
        }

        const added: IFurnitureData[] = [];

        if(responseData.roomitemtypes) added.push(...this.parseFloorItems(responseData.roomitemtypes, updateLocalization));

        if(responseData.wallitemtypes) added.push(...this.parseWallItems(responseData.wallitemtypes, updateLocalization));

        return added;
    }

    private parseFloorItems(data: any, updateLocalization: boolean = true, collectAdded: boolean = true): IFurnitureData[]
    {
        const added: IFurnitureData[] = [];

        if(!data || !data.furnitype) return added;

        for(const furniture of data.furnitype)
        {
            if(!furniture) continue;

            const colors: number[] = [];

            if(furniture.partcolors)
            {
                for(const color of furniture.partcolors.color)
                {
                    let colorCode = (color as string);

                    if(colorCode.charCodeAt(0) === 35) colorCode = colorCode.slice(1);

                    colors.push(parseInt(colorCode, 16));
                }
            }

            const rawClassName = (furniture.classname as string);
            const starIndex = rawClassName.indexOf('*');
            const hasColorIndex = (starIndex >= 0);
            const className = hasColorIndex ? rawClassName.slice(0, starIndex) : rawClassName;
            const colorIndex = hasColorIndex ? parseInt(rawClassName.slice(starIndex + 1)) : 0;
            const allowStack = this.resolveBooleanFlag(furniture.allowstack, furniture.allow_stack, furniture.allowStack);

            const furnitureData = new FurnitureData(FurnitureType.FLOOR, furniture.id, furniture.classname, className, furniture.category, furniture.name, furniture.description, furniture.revision, furniture.xdim, furniture.ydim, 0, colors, hasColorIndex, colorIndex, furniture.adurl, furniture.offerid, furniture.buyout, furniture.rentofferid, furniture.rentbuyout, furniture.bc, furniture.customparams, furniture.specialtype, allowStack, furniture.canstandon, furniture.cansiton, furniture.canlayon, furniture.excludeddynamic, furniture.furniline, furniture.environment, furniture.rare,
                furniture.canputstuffon == null ? undefined : this.resolveBooleanFlag(furniture.canputstuffon),
                furniture.height == null || !Number.isFinite(Number(furniture.height)) ? undefined : Number(furniture.height),
                furniture.tradeable == null ? undefined : this.resolveBooleanFlag(furniture.tradeable),
                this.resolveOfferId(furniture.bcofferid));

            this._floorItems.set(furnitureData.id, furnitureData);

            if(collectAdded) added.push(furnitureData);

            if(updateLocalization) this.updateLocalizations(furnitureData);
        }

        return added;
    }

    private parseWallItems(data: any, updateLocalization: boolean = true, collectAdded: boolean = true): IFurnitureData[]
    {
        const added: IFurnitureData[] = [];

        if(!data || !data.furnitype) return added;

        for(const furniture of data.furnitype)
        {
            if(!furniture) continue;

            const allowStack = this.resolveBooleanFlag(furniture.allowstack, furniture.allow_stack, furniture.allowStack);
            const furnitureData = new FurnitureData(FurnitureType.WALL, furniture.id, furniture.classname, furniture.classname, furniture.category, furniture.name, furniture.description, furniture.revision, 0, 0, 0, null, false, 0, furniture.adurl, furniture.offerid, furniture.buyout, furniture.rentofferid, furniture.rentbuyout, furniture.bc, null, furniture.specialtype, allowStack, false, false, false, furniture.excludeddynamic, furniture.furniline, furniture.environment, furniture.rare,
                furniture.canputstuffon == null ? undefined : this.resolveBooleanFlag(furniture.canputstuffon),
                furniture.height == null || !Number.isFinite(Number(furniture.height)) ? undefined : Number(furniture.height),
                furniture.tradeable == null ? undefined : this.resolveBooleanFlag(furniture.tradeable),
                this.resolveOfferId(furniture.bcofferid));

            this._wallItems.set(furnitureData.id, furnitureData);

            if(collectAdded) added.push(furnitureData);

            if(updateLocalization) this.updateLocalizations(furnitureData);
        }

        return added;
    }

    private updateLocalizations(furniture: FurnitureData): void
    {
        switch(furniture.type)
        {
            case FurnitureType.FLOOR:
                GetLocalizationManager().setValue(('roomItem.name.' + furniture.id), furniture.name);
                GetLocalizationManager().setValue(('roomItem.desc.' + furniture.id), furniture.description);
                return;
            case FurnitureType.WALL:
                GetLocalizationManager().setValue(('wallItem.name.' + furniture.id), furniture.name);
                GetLocalizationManager().setValue(('wallItem.desc.' + furniture.id), furniture.description);
                return;
        }
    }

    /** An offer id from furnidata (bcofferid); -1 when absent or not a number, as Habbo's furnidata parser reads it. */
    private resolveOfferId(value: any): number
    {
        if(value === undefined || value === null || value === '') return -1;

        const offerId = Number(value);

        return Number.isInteger(offerId) ? offerId : -1;
    }

    private resolveBooleanFlag(...values: any[]): boolean
    {
        for(const value of values)
        {
            if(value === undefined || value === null) continue;

            if(typeof value === 'string')
            {
                const normalized = value.trim().toLowerCase();

                if(!normalized.length) continue;

                if([ '1', 'true', 'yes' ].includes(normalized)) return true;
                if([ '0', 'false', 'no' ].includes(normalized)) return false;
            }

            return !!value;
        }

        return false;
    }
}
