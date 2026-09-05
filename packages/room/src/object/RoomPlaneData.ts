import { IVector3D } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { RoomPlaneMaskData } from './RoomPlaneMaskData';

export class RoomPlaneData
{
    public static PLANE_UNDEFINED: number = 0;
    public static PLANE_FLOOR: number = 1;
    public static PLANE_WALL: number = 2;
    public static PLANE_LANDSCAPE: number = 3;
    public static PLANE_BILLBOARD: number = 4;

    private _type: number = 0;
    private _loc: Vector3d = null;
    private _leftSide: Vector3d = null;
    private _rightSide: Vector3d = null;
    private _normal: Vector3d = null;
    private _normalDirection: Vector3d = null;
    private _secondaryNormals: Vector3d[];
    private _masks: RoomPlaneMaskData[];

    constructor(type: number, location: IVector3D, leftSide: IVector3D, rightSide: IVector3D, secondaryNormals: IVector3D[])
    {
        let angleXY: number;
        let angleZ: number;
        let angleRoll: number;
        let deltaX: number;
        let deltaY: number;
        let index: number;
        let normalVector: IVector3D;
        let secondaryNormal: Vector3d;
        this._secondaryNormals = [];
        this._masks = [];
        this._loc = new Vector3d();
        this._loc.assign(location);
        this._leftSide = new Vector3d();
        this._leftSide.assign(leftSide);
        this._rightSide = new Vector3d();
        this._rightSide.assign(rightSide);
        this._type = type;
        if(((!(leftSide == null)) && (!(rightSide == null))))
        {
            this._normal = Vector3d.crossProduct(leftSide, rightSide);
            angleXY = 0;
            angleZ = 0;
            angleRoll = 0;
            deltaX = 0;
            deltaY = 0;
            if(((!(this.normal.x == 0)) || (!(this.normal.y == 0))))
            {
                deltaX = this.normal.x;
                deltaY = this.normal.y;
                angleXY = (360 + ((Math.atan2(deltaY, deltaX) / Math.PI) * 180));
                if(angleXY >= 360)
                {
                    angleXY = (angleXY - 360);
                }
                deltaX = Math.sqrt(((this.normal.x * this.normal.x) + (this.normal.y * this.normal.y)));
                deltaY = this.normal.z;
                angleZ = (360 + ((Math.atan2(deltaY, deltaX) / Math.PI) * 180));
                if(angleZ >= 360)
                {
                    angleZ = (angleZ - 360);
                }
            }
            else
            {
                if(this.normal.z < 0)
                {
                    angleZ = 90;
                }
                else
                {
                    angleZ = 270;
                }
            }
            this._normalDirection = new Vector3d(angleXY, angleZ, angleRoll);
        }
        if(((!(secondaryNormals == null)) && (secondaryNormals.length > 0)))
        {
            index = 0;
            while(index < secondaryNormals.length)
            {
                normalVector = secondaryNormals[index];
                if(((!(normalVector == null)) && (normalVector.length > 0)))
                {
                    secondaryNormal = new Vector3d();
                    secondaryNormal.assign(normalVector);
                    secondaryNormal.multiply((1 / secondaryNormal.length));
                    this._secondaryNormals.push(secondaryNormal);
                }
                index++;
            }
        }
    }

    public get type(): number
    {
        return this._type;
    }

    public get loc(): IVector3D
    {
        return this._loc;
    }

    public get leftSide(): IVector3D
    {
        return this._leftSide;
    }

    public get rightSide(): IVector3D
    {
        return this._rightSide;
    }

    public get normal(): IVector3D
    {
        return this._normal;
    }

    public get normalDirection(): IVector3D
    {
        return this._normalDirection;
    }

    public get secondaryNormalCount(): number
    {
        return this._secondaryNormals.length;
    }

    public get maskCount(): number
    {
        return this._masks.length;
    }

    public getSecondaryNormal(index: number): IVector3D
    {
        if(((index < 0) || (index >= this.secondaryNormalCount)))
        {
            return null;
        }
        const secondaryNormal: Vector3d = new Vector3d();
        secondaryNormal.assign((this._secondaryNormals[index]));
        return secondaryNormal;
    }

    public addMask(leftSideLoc: number, rightSideLoc: number, leftSideLength: number, rightSideLength: number): void
    {
        const mask: RoomPlaneMaskData = new RoomPlaneMaskData(leftSideLoc, rightSideLoc, leftSideLength, rightSideLength);
        this._masks.push(mask);
    }

    private getMask(index: number): RoomPlaneMaskData
    {
        if(((index < 0) || (index >= this.maskCount)))
        {
            return null;
        }
        return this._masks[index];
    }

    public getMaskLeftSideLoc(index: number): number
    {
        const mask: RoomPlaneMaskData = this.getMask(index);
        if(mask != null)
        {
            return mask.leftSideLoc;
        }
        return -1;
    }

    public getMaskRightSideLoc(index: number): number
    {
        const mask: RoomPlaneMaskData = this.getMask(index);
        if(mask != null)
        {
            return mask.rightSideLoc;
        }
        return -1;
    }

    public getMaskLeftSideLength(index: number): number
    {
        const mask: RoomPlaneMaskData = this.getMask(index);
        if(mask != null)
        {
            return mask.leftSideLength;
        }
        return -1;
    }

    public getMaskRightSideLength(index: number): number
    {
        const mask: RoomPlaneMaskData = this.getMask(index);
        if(mask != null)
        {
            return mask.rightSideLength;
        }
        return -1;
    }
}
