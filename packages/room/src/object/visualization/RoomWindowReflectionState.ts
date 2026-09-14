import { IVector3D } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { Texture } from 'pixi.js';

export interface IWindowReflectionUnitLayer
{
    texture: Texture;
    offsetX: number;
    offsetY: number;
    alpha: number;
    flipH: boolean;
}

export interface IWindowReflectionUnitState
{
    id: number;
    layers: IWindowReflectionUnitLayer[];
    layersByDirection: ReadonlyMap<number, IWindowReflectionUnitLayer[]>;
    direction: number;
    location: IVector3D;
    origin: IVector3D;
    sizeX: number;
    sizeY: number;
    roomId: string;
    version: number;
}

export interface IWindowReflectionAvatarState
{
    id: number;
    texture: Texture;
    mirrors: ReadonlyMap<number, Texture>;
    direction: number;
    location: IVector3D;
    verticalOffset: number;
    roomId: string;
    version: number;
}

export class RoomWindowReflectionState
{
    private static _avatars: Map<string, IWindowReflectionAvatarState> = new Map();
    private static _units: Map<string, IWindowReflectionUnitState> = new Map();
    private static _zones: Map<object, { location: IVector3D; normal: IVector3D; roomId: string }> = new Map();
    private static _updateId: number = 0;
    private static _version: number = 0;

    private static key(id: number, roomId: string): string
    {
        return ((roomId || '') + '|' + id);
    }

    private static matchesRoom(entryRoomId: string, roomId: string): boolean
    {
        return (!roomId || !entryRoomId || (entryRoomId === roomId));
    }

    public static registerZone(owner: object, location: IVector3D, normal: IVector3D, roomId: string = null): void
    {
        this._zones.set(owner, { location, normal, roomId });
    }

    public static unregisterZone(owner: object): void
    {
        this._zones.delete(owner);
    }

    public static get hasZones(): boolean
    {
        return (this._zones.size > 0);
    }

    private static planeDistance(location: IVector3D, planeLocation: IVector3D, normal: IVector3D): number
    {
        const length = normal.length;

        if(length <= 0) return Number.POSITIVE_INFINITY;

        const dot = (((location.x - planeLocation.x) * normal.x) + ((location.y - planeLocation.y) * normal.y) + ((location.z - planeLocation.z) * normal.z));

        return Math.abs(dot / length);
    }

    public static isNearAnyZone(location: IVector3D, roomId: string = null, range: number = 0.8): boolean
    {
        if(!location || !this._zones.size) return false;

        for(const zone of this._zones.values())
        {
            if(!this.matchesRoom(zone.roomId, roomId)) continue;

            if(this.planeDistance(location, zone.location, zone.normal) <= range) return true;
        }

        return false;
    }

    public static getZoneNormalsNear(location: IVector3D, roomId: string = null, range: number = 0.8): IVector3D[]
    {
        const result: IVector3D[] = [];

        if(!location || !this._zones.size) return result;

        for(const zone of this._zones.values())
        {
            if(!this.matchesRoom(zone.roomId, roomId)) continue;

            if(this.planeDistance(location, zone.location, zone.normal) > range) continue;

            const length = Math.hypot(zone.normal.x, zone.normal.y);

            if(length <= 0.0001) continue;

            const nx = (zone.normal.x / length);
            const ny = (zone.normal.y / length);

            if(result.some(existing => (Math.abs((existing.x * nx) + (existing.y * ny)) > 0.99))) continue;

            result.push(new Vector3d(nx, ny, 0));
        }

        return result;
    }

    public static reflectDirection(directionDeg: number, normalX: number, normalY: number): number
    {
        const snapped = ((((Math.round((directionDeg || 0) / 45) * 45) % 360) + 360) % 360);
        const length = Math.hypot(normalX, normalY);

        if(length <= 0.0001) return snapped;

        const nx = (normalX / length);
        const ny = (normalY / length);
        const radians = (((snapped - 90) * Math.PI) / 180);
        const fx = Math.cos(radians);
        const fy = Math.sin(radians);
        const dot = ((fx * nx) + (fy * ny));
        const rx = (fx - (2 * dot * nx));
        const ry = (fy - (2 * dot * ny));
        const degrees = (((Math.atan2(ry, rx) * 180) / Math.PI) + 90);

        return ((((Math.round(degrees / 45) * 45) % 360) + 360) % 360);
    }

    public static hasEntryNear(planeLocation: IVector3D, normal: IVector3D, roomId: string = null, range: number = 0.8): boolean
    {
        if(!planeLocation || !normal) return false;

        for(const avatar of this._avatars.values())
        {
            if(!avatar.location || !this.matchesRoom(avatar.roomId, roomId)) continue;

            if(this.planeDistance(avatar.location, planeLocation, normal) <= range) return true;
        }

        for(const unit of this._units.values())
        {
            if(!unit.location || !this.matchesRoom(unit.roomId, roomId)) continue;

            if(this.planeDistance(unit.location, planeLocation, normal) <= range) return true;
        }

        return false;
    }

    public static getSignatureNear(planeLocation: IVector3D, normal: IVector3D, roomId: string = null, range: number = 0.8): string
    {
        if(!planeLocation || !normal) return '';

        let signature = '';

        for(const avatar of this._avatars.values())
        {
            if(!avatar.location || !this.matchesRoom(avatar.roomId, roomId)) continue;

            if(this.planeDistance(avatar.location, planeLocation, normal) <= range) signature += ('a' + avatar.id + ':' + avatar.version + ';');
        }

        for(const unit of this._units.values())
        {
            if(!unit.location || !this.matchesRoom(unit.roomId, roomId)) continue;

            if(this.planeDistance(unit.location, planeLocation, normal) <= range) signature += ('u' + unit.id + ':' + unit.version + ';');
        }

        return signature;
    }

    public static setUnit(id: number, layers: IWindowReflectionUnitLayer[], layersByDirection: ReadonlyMap<number, IWindowReflectionUnitLayer[]>, direction: number, location: IVector3D, origin: IVector3D, roomId: string = null, sizeX: number = 1, sizeY: number = 1): void
    {
        if(!layers?.length || !location) return;

        const storedOrigin = new Vector3d();

        storedOrigin.assign(origin || location);

        this._units.set(this.key(id, roomId), { id, layers, layersByDirection: (layersByDirection || new Map()), direction: (direction || 0), location, origin: storedOrigin, sizeX: Math.max(1, (sizeX || 1)), sizeY: Math.max(1, (sizeY || 1)), roomId, version: ++this._version });

        this._updateId++;
    }

    public static removeUnit(id: number, roomId: string = null): void
    {
        if(this._units.delete(this.key(id, roomId))) this._updateId++;
    }

    public static getUnits(roomId: string = null): IWindowReflectionUnitState[]
    {
        return Array.from(this._units.values()).filter(unit => this.matchesRoom(unit.roomId, roomId));
    }

    public static getUnit(id: number, roomId: string = null): IWindowReflectionUnitState
    {
        return (this._units.get(this.key(id, roomId)) || this._units.get(this.key(id, null)) || null);
    }

    public static getAvatarLocation(id: number, roomId: string = null): IVector3D
    {
        return ((this._avatars.get(this.key(id, roomId)) || this._avatars.get(this.key(id, null)))?.location || null);
    }

    public static setAvatar(id: number, texture: Texture, mirrors: ReadonlyMap<number, Texture>, direction: number, location: IVector3D, verticalOffset: number = 0, roomId: string = null): void
    {
        if(!texture || !location) return;

        const storedLocation = new Vector3d();

        storedLocation.assign(location);

        this._avatars.set(this.key(id, roomId), {
            id,
            texture,
            mirrors: (mirrors || new Map()),
            direction: (direction || 0),
            location: storedLocation,
            verticalOffset,
            roomId,
            version: ++this._version
        });

        this._updateId++;
    }

    public static removeAvatar(id: number, roomId: string = null): void
    {
        if(this._avatars.delete(this.key(id, roomId))) this._updateId++;
    }

    public static getAvatars(roomId: string = null): IWindowReflectionAvatarState[]
    {
        return Array.from(this._avatars.values()).filter(avatar => this.matchesRoom(avatar.roomId, roomId));
    }

    public static get updateId(): number
    {
        return this._updateId;
    }

    public static clearRoom(roomId: string): void
    {
        let removed = false;

        for(const [key, unit] of this._units)
        {
            if(!unit.roomId || !roomId || (unit.roomId === roomId))
            {
                this._units.delete(key);

                removed = true;
            }
        }

        for(const [key, avatar] of this._avatars)
        {
            if(!avatar.roomId || !roomId || (avatar.roomId === roomId))
            {
                this._avatars.delete(key);

                removed = true;
            }
        }

        if(removed) this._updateId++;
    }
}
