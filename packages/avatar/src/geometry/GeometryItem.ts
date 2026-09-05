import { Node3D, Vector3d } from '@octane/utils';

export class GeometryItem extends Node3D
{
    private _id: string;
    private _radius: number;
    private _normal: Vector3d;
    private _isDoubleSided: boolean;
    private _isDynamic: boolean;

    constructor(data: any, isDynamic: boolean = false)
    {
        super(parseFloat(data.x), parseFloat(data.y), parseFloat(data.z));

        this._id = data.id;
        this._radius = parseFloat(data.radius);
        this._normal = new Vector3d(parseFloat(data.nx), parseFloat(data.ny), parseFloat(data.nz));
        this._isDoubleSided = data.double || false;
        this._isDynamic = isDynamic;
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

    public get normal(): Vector3d
    {
        return this._normal;
    }

    public get isDoubleSided(): boolean
    {
        return this._isDoubleSided;
    }

    public toString(): string
    {
        return `${this._id}: ${this.location.toString()} - ${this.transformedLocation.toString()}`;
    }

    public get isDynamic(): boolean
    {
        return this._isDynamic;
    }
}
