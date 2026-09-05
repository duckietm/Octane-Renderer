import { IAvatarImage } from '@octane/api';
import { Matrix4x4, Node3D, Vector3d } from '@octane/utils';
import { GeometryItem } from './GeometryItem';

export class GeometryBodyPart extends Node3D
{
    private _id: string;
    private _radius: number;
    private _parts: Map<string, GeometryItem>;
    private _dynamicParts: Map<IAvatarImage, { [index: string]: GeometryItem }>;

    constructor(data: any)
    {
        super(parseFloat(data.x), parseFloat(data.y), parseFloat(data.z));

        this._id = data.id;
        this._radius = parseFloat(data.radius);
        this._parts = new Map();
        this._dynamicParts = new Map();

        if(data.items && (data.items.length > 0))
        {
            for(const item of data.items)
            {
                if(!item) continue;

                const geometryItem = new GeometryItem(item);

                this._parts.set(geometryItem.id, geometryItem);
            }
        }
    }

    public getDynamicParts(avatar: IAvatarImage): GeometryItem[]
    {
        const existing = this._dynamicParts.get(avatar);
        const parts: GeometryItem[] = [];

        if(existing)
        {
            for(const index in existing)
            {
                const item = existing[index];

                if(!item) continue;

                parts.push(item);
            }
        }

        return parts;
    }

    public getPartIds(avatar: IAvatarImage): string[]
    {
        const ids: string[] = [];

        for(const part of this._parts.values())
        {
            if(!part) continue;

            ids.push(part.id);
        }

        if(avatar)
        {
            const existing = this._dynamicParts.get(avatar);

            if(existing)
            {
                for(const index in existing)
                {
                    const part = existing[index];

                    if(!part) continue;

                    ids.push(part.id);
                }
            }
        }

        return ids;
    }

    public removeDynamicParts(avatar: IAvatarImage): boolean
    {
        this._dynamicParts.delete(avatar);

        return true;
    }

    public addPart(data: any, avatar: IAvatarImage): boolean
    {
        if(this.hasPart(data.id, avatar)) return false;

        let existing = this._dynamicParts.get(avatar);

        if(!existing)
        {
            existing = {};

            this._dynamicParts.set(avatar, existing);
        }

        existing[data.id] = new GeometryItem(data, true);

        return true;
    }

    public hasPart(partId: string, avatar: IAvatarImage): boolean
    {
        let existingPart = (this._parts.get(partId) || null);

        if(!existingPart && (this._dynamicParts.get(avatar) !== undefined))
        {
            existingPart = (this._dynamicParts.get(avatar)[partId] || null);
        }

        return (existingPart !== null);
    }

    public getParts(matrix: Matrix4x4, cameraLocation: Vector3d, activeParts: any[], avatar: IAvatarImage): string[]
    {
        const parts: [number, GeometryItem][] = [];

        for(const part of this._parts.values())
        {
            if(!part) continue;

            part.applyTransform(matrix);

            parts.push([part.getDistance(cameraLocation), part]);
        }

        const existingDynamic = this._dynamicParts.get(avatar);

        if(existingDynamic)
        {
            for(const index in existingDynamic)
            {
                const part = existingDynamic[index];

                if(!part) continue;

                part.applyTransform(matrix);

                parts.push([part.getDistance(cameraLocation), part]);
            }
        }

        parts.sort((a, b) =>
        {
            const distanceA = a[0];
            const distanceB = b[0];

            if(distanceA < distanceB) return -1;

            if(distanceA > distanceB) return 1;

            return 0;
        });

        const partIds: string[] = [];

        for(const part of parts)
        {
            if(!part) continue;

            partIds.push(part[1].id);
        }

        return partIds;
    }

    public getDistance(location: Vector3d): number
    {
        const nearEdge = Math.abs(((location.z - this.transformedLocation.z) - this._radius));
        const farEdge = Math.abs(((location.z - this.transformedLocation.z) + this._radius));

        return Math.min(nearEdge, farEdge);
    }

    public get id(): string
    {
        return this._id;
    }

    public get radius(): number
    {
        return this._radius;
    }
}
