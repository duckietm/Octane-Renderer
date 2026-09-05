import { IRoomGeometry, IVector3D } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { Point } from 'pixi.js';

export class RoomGeometry implements IRoomGeometry
{
    public static SCALE_ZOOMED_IN: number = 64;
    public static SCALE_ZOOMED_OUT: number = 32;

    private _updateId: number = 0;
    private _x: IVector3D;
    private _y: IVector3D;
    private _z: IVector3D;
    private _directionAxis: IVector3D;
    private _location: IVector3D;
    private _direction: IVector3D;
    private _depth: IVector3D;
    private _scale: number = 1;
    private _x_scale: number = 1;
    private _y_scale: number = 1;
    private _z_scale: number = 1;
    private _x_scale_internal: number = 1;
    private _y_scale_internal: number = 1;
    private _z_scale_internal: number = 1;
    private _loc: IVector3D;
    private _dir: IVector3D;
    private _clipNear: number = -500;
    private _clipFar: number = 500;
    private _displacements: Map<string, IVector3D> = null;

    constructor(scale: number, direction: IVector3D, location: IVector3D, depthVector: IVector3D = null)
    {
        this.scale = scale;
        this._x = new Vector3d();
        this._y = new Vector3d();
        this._z = new Vector3d();
        this._directionAxis = new Vector3d();
        this._location = new Vector3d();
        this._direction = new Vector3d();
        this._depth = new Vector3d();
        this._x_scale_internal = 1;
        this._y_scale_internal = 1;
        this.x_scale = 1;
        this.y_scale = 1;
        this._z_scale_internal = (Math.sqrt((1 / 2)) / Math.sqrt((3 / 4)));
        this.z_scale = 1;
        this.location = new Vector3d(location.x, location.y, location.z);
        this.direction = new Vector3d(direction.x, direction.y, direction.z);
        if(depthVector != null)
        {
            this.setDepthVector(depthVector);
        }
        else
        {
            this.setDepthVector(direction);
        }
        this._displacements = new Map();
    }

    public static getIntersectionVector(linePoint: IVector3D, lineVector: IVector3D, planePoint: IVector3D, planeNormal: IVector3D): IVector3D
    {
        const denominator: number = Vector3d.dotProduct(lineVector, planeNormal);
        if(Math.abs(denominator) < 1E-5)
        {
            return null;
        }
        const difference: IVector3D = Vector3d.dif(linePoint, planePoint);
        const scalar: number = (-(Vector3d.dotProduct(planeNormal, difference)) / denominator);
        const intersection: IVector3D = Vector3d.sum(linePoint, Vector3d.product(lineVector, scalar));
        return intersection;
    }


    public get updateId(): number
    {
        return this._updateId;
    }

    public get scale(): number
    {
        return this._scale / Math.sqrt(0.5);
    }

    public set scale(scale: number)
    {
        if(scale <= 1)
        {
            scale = 1;
        }
        scale = (scale * Math.sqrt(0.5));
        if(scale != this._scale)
        {
            this._scale = scale;
            this._updateId++;
        }
    }

    public get directionAxis(): IVector3D
    {
        return this._directionAxis;
    }

    public get location(): IVector3D
    {
        this._location.assign(this._loc);
        this._location.x = (this._location.x * this._x_scale);
        this._location.y = (this._location.y * this._y_scale);
        this._location.z = (this._location.z * this._z_scale);
        return this._location;
    }

    public set location(location: IVector3D)
    {
        if(location == null)
        {
            return;
        }
        if(this._loc == null)
        {
            this._loc = new Vector3d();
        }
        const previousX: number = this._loc.x;
        const previousY: number = this._loc.y;
        const previousZ: number = this._loc.z;
        this._loc.assign(location);
        this._loc.x = (this._loc.x / this._x_scale);
        this._loc.y = (this._loc.y / this._y_scale);
        this._loc.z = (this._loc.z / this._z_scale);
        if((((!(this._loc.x == previousX)) || (!(this._loc.y == previousY))) || (!(this._loc.z == previousZ))))
        {
            this._updateId++;
        }
    }

    public get direction(): IVector3D
    {
        return this._direction;
    }

    public set direction(direction: IVector3D)
    {
        let cosZ: number;
        let sinZ: number;
        let xAxis3: IVector3D;
        let yAxis3: IVector3D;
        let zAxis3: IVector3D;
        if(direction == null)
        {
            return;
        }
        if(this._dir == null)
        {
            this._dir = new Vector3d();
        }
        const previousX: number = this._dir.x;
        const previousY: number = this._dir.y;
        const previousZ: number = this._dir.z;
        this._dir.assign(direction);
        this._direction.assign(direction);
        if((((!(this._dir.x == previousX)) || (!(this._dir.y == previousY))) || (!(this._dir.z == previousZ))))
        {
            this._updateId++;
        }
        const unitY: IVector3D = new Vector3d(0, 1, 0);
        const unitZ: IVector3D = new Vector3d(0, 0, 1);
        const unitX: IVector3D = new Vector3d(1, 0, 0);
        const radiansX: number = ((direction.x / 180) * Math.PI);
        const radiansY: number = ((direction.y / 180) * Math.PI);
        const radiansZ: number = ((direction.z / 180) * Math.PI);
        const cosX: number = Math.cos(radiansX);
        const sinX: number = Math.sin(radiansX);
        const xAxis1: IVector3D = Vector3d.sum(Vector3d.product(unitY, cosX), Vector3d.product(unitX, -(sinX)));
        const zAxis1: IVector3D = new Vector3d(unitZ.x, unitZ.y, unitZ.z);
        const yAxis1: IVector3D = Vector3d.sum(Vector3d.product(unitY, sinX), Vector3d.product(unitX, cosX));
        const cosY: number = Math.cos(radiansY);
        const sinY: number = Math.sin(radiansY);
        const xAxis2: IVector3D = new Vector3d(xAxis1.x, xAxis1.y, xAxis1.z);
        const yAxis2: IVector3D = Vector3d.sum(Vector3d.product(zAxis1, cosY), Vector3d.product(yAxis1, sinY));
        const zAxis2: IVector3D = Vector3d.sum(Vector3d.product(zAxis1, -(sinY)), Vector3d.product(yAxis1, cosY));
        if(radiansZ != 0)
        {
            cosZ = Math.cos(radiansZ);
            sinZ = Math.sin(radiansZ);
            xAxis3 = Vector3d.sum(Vector3d.product(xAxis2, cosZ), Vector3d.product(yAxis2, sinZ));
            yAxis3 = Vector3d.sum(Vector3d.product(xAxis2, -(sinZ)), Vector3d.product(yAxis2, cosZ));
            zAxis3 = new Vector3d(zAxis2.x, zAxis2.y, zAxis2.z);
            this._x.assign(xAxis3);
            this._y.assign(yAxis3);
            this._z.assign(zAxis3);
            this._directionAxis.assign(this._z);
        }
        else
        {
            this._x.assign(xAxis2);
            this._y.assign(yAxis2);
            this._z.assign(zAxis2);
            this._directionAxis.assign(this._z);
        }
    }

    public set x_scale(xScale: number)
    {
        if(this._x_scale != (xScale * this._x_scale_internal))
        {
            this._x_scale = (xScale * this._x_scale_internal);
            this._updateId++;
        }
    }

    public set y_scale(yScale: number)
    {
        if(this._y_scale != (yScale * this._y_scale_internal))
        {
            this._y_scale = (yScale * this._y_scale_internal);
            this._updateId++;
        }
    }

    public set z_scale(zScale: number)
    {
        if(this._z_scale != (zScale * this._z_scale_internal))
        {
            this._z_scale = (zScale * this._z_scale_internal);
            this._updateId++;
        }
    }

    public dispose(): void
    {
        this._x = null;
        this._y = null;
        this._z = null;
        this._loc = null;
        this._dir = null;
        this._directionAxis = null;
        this._location = null;
        if(this._displacements != null)
        {
            this._displacements.clear();
            this._displacements = null;
        }
    }

    public setDisplacement(location: IVector3D, displacement: IVector3D): void
    {
        let key: string;
        let vector: IVector3D;
        if(((location == null) || (displacement == null)))
        {
            return;
        }
        if(this._displacements != null)
        {
            key = Math.trunc(Math.round(location.x)) + '_' + Math.trunc(Math.round(location.y)) + '_' + Math.trunc(Math.round(location.z));
            this._displacements.delete(key);
            vector = new Vector3d();
            vector.assign(displacement);
            this._displacements.set(key, vector);
            this._updateId++;
        }
    }

    private getDisplacenent(location: IVector3D): IVector3D
    {
        let key: string;
        if(this._displacements != null)
        {
            key = Math.trunc(Math.round(location.x)) + '_' + Math.trunc(Math.round(location.y)) + '_' + Math.trunc(Math.round(location.z));
            return this._displacements.get(key);
        }
        return null;
    }

    public setDepthVector(direction: IVector3D): void
    {
        let cosZ: number;
        let sinZ: number;
        let xAxis3: IVector3D;
        let yAxis3: IVector3D;
        let zAxis3: IVector3D;
        const unitY: IVector3D = new Vector3d(0, 1, 0);
        const unitZ: IVector3D = new Vector3d(0, 0, 1);
        const unitX: IVector3D = new Vector3d(1, 0, 0);
        const radiansX: number = ((direction.x / 180) * Math.PI);
        const radiansY: number = ((direction.y / 180) * Math.PI);
        const radiansZ: number = ((direction.z / 180) * Math.PI);
        const cosX: number = Math.cos(radiansX);
        const sinX: number = Math.sin(radiansX);
        const xAxis1: IVector3D = Vector3d.sum(Vector3d.product(unitY, cosX), Vector3d.product(unitX, -(sinX)));
        const zAxis1: IVector3D = new Vector3d(unitZ.x, unitZ.y, unitZ.z);
        const yAxis1: IVector3D = Vector3d.sum(Vector3d.product(unitY, sinX), Vector3d.product(unitX, cosX));
        const cosY: number = Math.cos(radiansY);
        const sinY: number = Math.sin(radiansY);
        const xAxis2: IVector3D = new Vector3d(xAxis1.x, xAxis1.y, xAxis1.z);
        const yAxis2: IVector3D = Vector3d.sum(Vector3d.product(zAxis1, cosY), Vector3d.product(yAxis1, sinY));
        const zAxis2: IVector3D = Vector3d.sum(Vector3d.product(zAxis1, -(sinY)), Vector3d.product(yAxis1, cosY));
        if(radiansZ != 0)
        {
            cosZ = Math.cos(radiansZ);
            sinZ = Math.sin(radiansZ);
            xAxis3 = Vector3d.sum(Vector3d.product(xAxis2, cosZ), Vector3d.product(yAxis2, sinZ));
            yAxis3 = Vector3d.sum(Vector3d.product(xAxis2, -(sinZ)), Vector3d.product(yAxis2, cosZ));
            zAxis3 = new Vector3d(zAxis2.x, zAxis2.y, zAxis2.z);
            this._depth.assign(zAxis3);
        }
        else
        {
            this._depth.assign(zAxis2);
        }
        this._updateId++;
    }

    public adjustLocation(location: IVector3D, offset: number): void
    {
        if(((location == null) || (this._z == null)))
        {
            return;
        }
        const displacement: IVector3D = Vector3d.product(this._z, -(offset));
        const adjustedLocation: IVector3D = new Vector3d((location.x + displacement.x), (location.y + displacement.y), (location.z + displacement.z));
        this.location = adjustedLocation;
    }

    public getCoordinatePosition(vector: IVector3D): IVector3D
    {
        if(vector == null)
        {
            return null;
        }
        const x: number = Vector3d.scalarProjection(vector, this._x);
        const y: number = Vector3d.scalarProjection(vector, this._y);
        const z: number = Vector3d.scalarProjection(vector, this._z);
        const position: IVector3D = new Vector3d(x, y, z);
        return position;
    }

    public getScreenPosition(location: IVector3D): IVector3D
    {
        let position: IVector3D = Vector3d.dif(location, this._loc);
        position.x = (position.x * this._x_scale);
        position.y = (position.y * this._y_scale);
        position.z = (position.z * this._z_scale);
        let depth: number = Vector3d.scalarProjection(position, this._depth);
        if(((depth < this._clipNear) || (depth > this._clipFar)))
        {
            return null;
        }
        let screenX: number = Vector3d.scalarProjection(position, this._x);
        let screenY: number = -(Vector3d.scalarProjection(position, this._y));
        screenX = (screenX * this._scale);
        screenY = (screenY * this._scale);
        const displacement: IVector3D = this.getDisplacenent(location);
        if(displacement != null)
        {
            position = Vector3d.dif(location, this._loc);
            position.add(displacement);
            position.x = (position.x * this._x_scale);
            position.y = (position.y * this._y_scale);
            position.z = (position.z * this._z_scale);
            depth = Vector3d.scalarProjection(position, this._depth);
        }
        position.x = screenX;
        position.y = screenY;
        position.z = depth;
        return position;
    }

    public getScreenPoint(location: IVector3D): Point
    {
        const position: IVector3D = this.getScreenPosition(location);
        if(position == null)
        {
            return null;
        }
        const point: Point = new Point(position.x, position.y);
        return point;
    }

    public getPlanePosition(point: Point, origin: IVector3D, axisX: IVector3D, axisY: IVector3D): Point
    {
        let resultX: number;
        let resultY: number;
        const screenX: number = (point.x / this._scale);
        const screenY: number = (-(point.y) / this._scale);
        const planeVector: IVector3D = Vector3d.product(this._x, screenX);
        planeVector.add(Vector3d.product(this._y, screenY));
        const linePoint: IVector3D = new Vector3d((this._loc.x * this._x_scale), (this._loc.y * this._y_scale), (this._loc.z * this._z_scale));
        linePoint.add(planeVector);
        const lineVector: IVector3D = this._z;
        const scaledOrigin: IVector3D = new Vector3d((origin.x * this._x_scale), (origin.y * this._y_scale), (origin.z * this._z_scale));
        const scaledAxisX: IVector3D = new Vector3d((axisX.x * this._x_scale), (axisX.y * this._y_scale), (axisX.z * this._z_scale));
        const scaledAxisY: IVector3D = new Vector3d((axisY.x * this._x_scale), (axisY.y * this._y_scale), (axisY.z * this._z_scale));
        const normal: IVector3D = Vector3d.crossProduct(scaledAxisX, scaledAxisY);
        const intersection: IVector3D = new Vector3d();
        intersection.assign(RoomGeometry.getIntersectionVector(linePoint, lineVector, scaledOrigin, normal));
        if(intersection != null)
        {
            intersection.subtract(scaledOrigin);
            resultX = ((Vector3d.scalarProjection(intersection, axisX) / scaledAxisX.length) * axisX.length);
            resultY = ((Vector3d.scalarProjection(intersection, axisY) / scaledAxisY.length) * axisY.length);
            return new Point(resultX, resultY);
        }
        return null;
    }

    public performZoom(): void
    {
        if(this.isZoomedIn())
        {
            this.scale = RoomGeometry.SCALE_ZOOMED_OUT;
        }
        else
        {
            this.scale = RoomGeometry.SCALE_ZOOMED_IN;
        }
    }

    public isZoomedIn(): boolean
    {
        return this.scale == RoomGeometry.SCALE_ZOOMED_IN;
    }

    public performZoomOut(): void
    {
        this.scale = RoomGeometry.SCALE_ZOOMED_OUT;
    }

    public performZoomIn(): void
    {
        this.scale = RoomGeometry.SCALE_ZOOMED_IN;
    }
}
