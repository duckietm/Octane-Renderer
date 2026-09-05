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

    public async init(): Promise<void>
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

        if(responseData.roomitemtypes) this.parseFloorItems(responseData.roomitemtypes);

        if(responseData.wallitemtypes) this.parseWallItems(responseData.wallitemtypes);
    }

    // Reload a furniture-data chunk such as custom/imported.jsonc and merge it
    // into the existing maps. Returned entries let RoomContentLoader update
    // without a full client reload.
    public async mergeFromUrl(url: string): Promise<IFurnitureData[]>
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

        if(responseData.roomitemtypes) added.push(...this.parseFloorItems(responseData.roomitemtypes));

        if(responseData.wallitemtypes) added.push(...this.parseWallItems(responseData.wallitemtypes));

        return added;
    }

    private parseFloorItems(data: any): IFurnitureData[]
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

                    if(colorCode.charAt(0) === '#')
                    {
                        colorCode = colorCode.replace('#', '');

                        colors.push(parseInt(colorCode, 16));
                    }
                    else
                    {
                        colors.push((parseInt(colorCode, 16)));
                    }
                }
            }

            const classSplit = (furniture.classname as string).split('*');
            const className = classSplit[0];
            const colorIndex = ((classSplit.length > 1) ? parseInt(classSplit[1]) : 0);
            const hasColorIndex = (classSplit.length > 1);
            const allowStack = this.resolveBooleanFlag(furniture.allowstack, furniture.allow_stack, furniture.allowStack);

            const furnitureData = new FurnitureData(FurnitureType.FLOOR, furniture.id, furniture.classname, className, furniture.category, furniture.name, furniture.description, furniture.revision, furniture.xdim, furniture.ydim, 0, colors, hasColorIndex, colorIndex, furniture.adurl, furniture.offerid, furniture.buyout, furniture.rentofferid, furniture.rentbuyout, furniture.bc, furniture.customparams, furniture.specialtype, allowStack, furniture.canstandon, furniture.cansiton, furniture.canlayon, furniture.excludeddynamic, furniture.furniline, furniture.environment, furniture.rare);

            this._floorItems.set(furnitureData.id, furnitureData);

            added.push(furnitureData);

            this.updateLocalizations(furnitureData);
        }

        return added;
    }

    private parseWallItems(data: any): IFurnitureData[]
    {
        const added: IFurnitureData[] = [];

        if(!data || !data.furnitype) return added;

        for(const furniture of data.furnitype)
        {
            if(!furniture) continue;

            const allowStack = this.resolveBooleanFlag(furniture.allowstack, furniture.allow_stack, furniture.allowStack);
            const furnitureData = new FurnitureData(FurnitureType.WALL, furniture.id, furniture.classname, furniture.classname, furniture.category, furniture.name, furniture.description, furniture.revision, 0, 0, 0, null, false, 0, furniture.adurl, furniture.offerid, furniture.buyout, furniture.rentofferid, furniture.rentbuyout, furniture.bc, null, furniture.specialtype, allowStack, false, false, false, furniture.excludeddynamic, furniture.furniline, furniture.environment, furniture.rare);

            this._wallItems.set(furnitureData.id, furnitureData);

            added.push(furnitureData);

            this.updateLocalizations(furnitureData);
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
