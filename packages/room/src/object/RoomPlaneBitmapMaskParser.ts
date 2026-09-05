import { IVector3D } from '@octane/api';
import { RoomMapMaskData } from './RoomMapMaskData';
import { RoomPlaneBitmapMaskData } from './RoomPlaneBitmapMaskData';

export class RoomPlaneBitmapMaskParser
{
    private _masks: Map<string, RoomPlaneBitmapMaskData>;

    constructor()
    {
        this._masks = new Map();
    }

    public get maskCount(): number
    {
        return this._masks.size;
    }

    public dispose(): void
    {
        if(this._masks)
        {
            this.reset();

            this._masks = null;
        }
    }

    public initialize(maskData: RoomMapMaskData): boolean
    {
        if(!maskData) return false;

        this._masks.clear();

        if(maskData.masks.length)
        {
            for(const mask of maskData.masks)
            {
                if(!mask) continue;

                const location = mask.locations.length ? mask.locations[0] : null;

                if(!location) continue;

                this._masks.set(mask.id, new RoomPlaneBitmapMaskData(mask.type, location, mask.category));
            }
        }

        return true;
    }

    public reset(): void
    {
        for(const mask of this._masks.values())
        {
            if(!mask) continue;

            mask.dispose();
        }

        this._masks.clear();
    }

    public addMask(id: string, type: string, location: IVector3D, category: string): void
    {
        const mask = new RoomPlaneBitmapMaskData(type, location, category);

        this._masks.delete(id);
        this._masks.set(id, mask);
    }

    public removeMask(id: string): boolean
    {
        const existing = this._masks.get(id);

        if(existing)
        {
            this._masks.delete(id);

            existing.dispose();

            return true;
        }

        return false;
    }

    public getXML(): RoomMapMaskData
    {
        const data = new RoomMapMaskData();

        for(const [key, mask] of this._masks.entries())
        {
            if(!mask) continue;

            const type = this.getMaskType(mask);
            const category = this.getMaskCategory(mask);
            const location = this.getMaskLocation(mask);

            if(type && category && location)
            {
                const newMask: any = {
                    id: key,
                    type: type,
                    category: category,
                    locations: [
                        {
                            x: location.x,
                            y: location.y,
                            z: location.z
                        }
                    ]
                };

                data.masks.push(newMask);
            }
        }

        return data;
    }

    public getMaskLocation(mask: RoomPlaneBitmapMaskData): IVector3D
    {
        if(!mask) return null;

        return mask.loc;
    }

    public getMaskType(mask: RoomPlaneBitmapMaskData): string
    {
        if(!mask) return null;

        return mask.type;
    }

    public getMaskCategory(mask: RoomPlaneBitmapMaskData): string
    {
        if(!mask) return null;

        return mask.category;
    }

    public get masks(): Map<string, RoomPlaneBitmapMaskData>
    {
        return this._masks;
    }
}
