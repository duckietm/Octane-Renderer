import { IVector3D } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { Texture } from 'pixi.js';

interface IWindowReflectionAvatarState
{
    id: number;
    texture: Texture;
    location: IVector3D;
    verticalOffset: number;
    direction: number;
    oppositeTexture: Texture;
}

export class RoomWindowReflectionState
{
    private static _avatars: Map<number, IWindowReflectionAvatarState> = new Map();
    private static _updateId: number = 0;

    public static setAvatar(id: number, texture: Texture, location: IVector3D, verticalOffset: number = 0, direction: number = 0, oppositeTexture: Texture = null): void
    {
        if(!texture || !location) return;

        const storedLocation = new Vector3d();

        storedLocation.assign(location);

        this._avatars.set(id, {
            id,
            texture,
            location: storedLocation,
            verticalOffset,
            direction,
            oppositeTexture: (oppositeTexture || texture)
        });

        // Always bump updateId so reflected walk cycles stay frame-synced
        // even when avatar textures are recycled/cached by reference.
        this._updateId++;
    }

    public static removeAvatar(id: number): void
    {
        if(this._avatars.delete(id)) this._updateId++;
    }

    public static getAvatars(): IWindowReflectionAvatarState[]
    {
        return Array.from(this._avatars.values());
    }

    public static get updateId(): number
    {
        return this._updateId;
    }
}
