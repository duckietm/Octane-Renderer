import { IAssetAvatarCanvas, IAvatarImage } from '@octane/api';
import { Matrix4x4, Vector3d } from '@octane/utils';
import { AvatarCanvas } from '../structure';
import { AvatarSet } from './AvatarSet';
import { GeometryBodyPart } from './GeometryBodyPart';

export class AvatarModelGeometry
{
    private _camera: Vector3d;
    private _avatarSet: AvatarSet;
    private _geometryTypes: Map<string, Map<string, GeometryBodyPart>>;
    private _itemIdToBodyPartMap: Map<string, Map<string, GeometryBodyPart>>;
    private _transformation: Matrix4x4;
    private _canvases: Map<string, Map<string, AvatarCanvas>>;

    constructor(data: any)
    {
        this._camera = new Vector3d(0, 0, 10);
        this._avatarSet = new AvatarSet(data.avatarSets[0]);
        this._geometryTypes = new Map();
        this._itemIdToBodyPartMap = new Map();
        this._transformation = new Matrix4x4();
        this._canvases = new Map();

        const camera = data.camera;

        if(camera)
        {
            this._camera.x = parseFloat(camera.x);
            this._camera.y = parseFloat(camera.y);
            this._camera.z = parseFloat(camera.z);
        }

        if(data.canvases && (data.canvases.length > 0))
        {
            for(const canvas of (data.canvases as IAssetAvatarCanvas[]))
            {
                if(!canvas) continue;

                const scale = canvas.scale;
                const geometries = new Map();

                if(canvas.geometries && (canvas.geometries.length > 0))
                {
                    for(const geometry of canvas.geometries)
                    {
                        if(!geometry) continue;

                        const avatarCanvas = new AvatarCanvas(geometry, scale);

                        geometries.set(avatarCanvas.id, avatarCanvas);
                    }
                }

                this._canvases.set(scale, geometries);
            }
        }

        if(data.types && (data.types.length > 0))
        {
            for(const type of data.types)
            {
                if(!type) continue;

                const bodyParts: Map<string, GeometryBodyPart> = new Map();
                const itemIds: Map<string, GeometryBodyPart> = new Map();

                if(type.bodyParts && (type.bodyParts.length > 0))
                {
                    for(const bodyPart of type.bodyParts)
                    {
                        if(!bodyPart) continue;

                        const geometryBodyPart = new GeometryBodyPart(bodyPart);

                        bodyParts.set(geometryBodyPart.id, geometryBodyPart);

                        for(const part of geometryBodyPart.getPartIds(null))
                        {
                            itemIds.set(part, geometryBodyPart);
                        }
                    }
                }

                this._geometryTypes.set(type.id, bodyParts);
                this._itemIdToBodyPartMap.set(type.id, itemIds);
            }
        }
    }

    public removeDynamicItems(avatar: IAvatarImage): void
    {
        for(const geometry of this._geometryTypes.values())
        {
            if(!geometry) continue;

            for(const part of geometry.values())
            {
                if(!part) continue;

                part.removeDynamicParts(avatar);
            }
        }
    }

    public getBodyPartIdsInAvatarSet(avatarSetId: string): string[]
    {
        const avatarSet = this._avatarSet.findAvatarSet(avatarSetId);

        if(!avatarSet) return [];

        return avatarSet.getBodyParts();
    }

    public isMainAvatarSet(avatarSetId: string): boolean
    {
        const avatarSet = this._avatarSet.findAvatarSet(avatarSetId);

        if(!avatarSet) return false;

        return avatarSet.isMain;
    }

    public getCanvas(scale: string, id: string): AvatarCanvas
    {
        const canvas = this._canvases.get(scale);

        if(!canvas) return null;

        return (canvas.get(id) || null);
    }

    private typeExists(geometryType: string): boolean
    {
        const existing = this._geometryTypes.get(geometryType);

        if(existing) return true;

        return false;
    }

    private hasBodyPart(geometryType: string, bodyPartId: string): boolean
    {
        if(this.typeExists(geometryType))
        {
            const existing = this._geometryTypes.get(geometryType);

            if(existing && existing.get(bodyPartId)) return true;
        }

        return false;
    }

    private getBodyPartIDs(geometryType: string): string[]
    {
        const parts = this.getBodyPartsOfType(geometryType);

        const types = [];

        if(parts)
        {
            for(const part of parts.values())
            {
                if(!part) continue;

                types.push(part.id);
            }
        }

        return types;
    }

    private getBodyPartsOfType(geometryType: string): Map<string, GeometryBodyPart>
    {
        if(this.typeExists(geometryType)) return this._geometryTypes.get(geometryType);

        return new Map();
    }

    public getBodyPart(geometryType: string, bodyPartId: string): GeometryBodyPart
    {
        return (this.getBodyPartsOfType(geometryType).get(bodyPartId) || null);
    }

    public getBodyPartOfItem(geometryType: string, itemId: string, avatar: IAvatarImage): GeometryBodyPart
    {
        const itemIds = this._itemIdToBodyPartMap.get(geometryType);

        if(itemIds)
        {
            const part = itemIds.get(itemId);

            if(part) return part;

            const parts = this.getBodyPartsOfType(geometryType);

            if(parts)
            {
                for(const part of parts.values())
                {
                    if(!part) continue;

                    if(part.hasPart(itemId, avatar)) return part;
                }
            }
        }

        return null;
    }

    private getBodyPartsInAvatarSet(bodyParts: Map<string, GeometryBodyPart>, avatarSetId: string): GeometryBodyPart[]
    {
        const parts = this.getBodyPartIdsInAvatarSet(avatarSetId);
        const geometryParts = [];

        for(const part of parts)
        {
            if(!part) continue;

            const bodyPart = bodyParts.get(part);

            if(bodyPart)
            {
                geometryParts.push(bodyPart);
            }
        }

        return geometryParts;
    }

    public getBodyPartsAtAngle(avatarSetId: string, direction: number, geometryType: string): string[]
    {
        if(!geometryType) return [];

        const geometryParts = this.getBodyPartsOfType(geometryType);
        const parts = this.getBodyPartsInAvatarSet(geometryParts, avatarSetId);
        const sets: [number, GeometryBodyPart][] = [];
        const ids: string[] = [];

        this._transformation = Matrix4x4.getYRotationMatrix(direction);

        for(const part of parts.values())
        {
            if(!part) continue;

            part.applyTransform(this._transformation);

            sets.push([part.getDistance(this._camera), part]);
        }

        sets.sort((first, second) =>
        {
            const distanceA = first[0];
            const distanceB = second[0];

            if(distanceA < distanceB) return -1;

            if(distanceA > distanceB) return 1;

            return 0;
        });

        for(const set of sets)
        {
            if(!set) continue;

            ids.push(set[1].id);
        }

        return ids;
    }

    public getParts(geometryType: string, bodyPartId: string, direction: number, items: any[], avatar: IAvatarImage): string[]
    {
        if(this.hasBodyPart(geometryType, bodyPartId))
        {
            const part = this.getBodyPartsOfType(geometryType).get(bodyPartId);

            this._transformation = Matrix4x4.getYRotationMatrix(direction);

            return part.getParts(this._transformation, this._camera, items, avatar);
        }

        return [];
    }
}
