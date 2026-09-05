import { IVector3D } from '@octane/api';
import { Vector3d } from '@octane/utils';

export class RoomCamera
{
    private static MOVE_SPEED_DENOMINATOR: number = 12;

    private _targetId: number = -1;
    private _targetCategory: number = -2;
    private _targetLoc: IVector3D = null;
    private _moveDistance: number = 0;
    private _previousMoveSpeed: number = 0;
    private _maintainPreviousMoveSpeed: boolean = false;
    private _currentLoc: IVector3D = null;
    private _targetObjectLoc: IVector3D;
    private _limitedLocX: boolean = false;
    private _limitedLocY: boolean = false;
    private _centeredLocX: boolean = false;
    private _centeredLocY: boolean = false;
    private _screenWd: number = 0;
    private _screenHt: number = 0;
    private _scale: number = 0;
    private _roomWd: number = 0;
    private _roomHt: number = 0;
    private _geometryUpdateId: number = -1;
    private _scaleChanged: boolean = false;
    private _followDuration: number;

    constructor()
    {
        this._targetObjectLoc = new Vector3d();
    }

    public get location(): IVector3D
    {
        return this._currentLoc;
    }

    public get targetId(): number
    {
        return this._targetId;
    }

    public set targetId(id: number)
    {
        this._targetId = id;
    }

    public get targetCategory(): number
    {
        return this._targetCategory;
    }

    public set targetCategory(category: number)
    {
        this._targetCategory = category;
    }

    public get targetObjectLoc(): IVector3D
    {
        return this._targetObjectLoc;
    }

    public set targetObjectLoc(location: IVector3D)
    {
        this._targetObjectLoc.assign(location);
    }

    public get limitedLocationX(): boolean
    {
        return this._limitedLocX;
    }

    public set limitedLocationX(value: boolean)
    {
        this._limitedLocX = value;
    }

    public get limitedLocationY(): boolean
    {
        return this._limitedLocY;
    }

    public set limitedLocationY(value: boolean)
    {
        this._limitedLocY = value;
    }

    public get centeredLocX(): boolean
    {
        return this._centeredLocX;
    }

    public set centeredLocX(value: boolean)
    {
        this._centeredLocX = value;
    }

    public get centeredLocY(): boolean
    {
        return this._centeredLocY;
    }

    public set centeredLocY(value: boolean)
    {
        this._centeredLocY = value;
    }

    public get screenWd(): number
    {
        return this._screenWd;
    }

    public set screenWd(width: number)
    {
        this._screenWd = width;
    }

    public get screenHt(): number
    {
        return this._screenHt;
    }

    public set screenHt(height: number)
    {
        this._screenHt = height;
    }

    public get scale(): number
    {
        return this._scale;
    }

    public set scale(scale: number)
    {
        if(this._scale != scale)
        {
            this._scale = scale;
            this._scaleChanged = true;
        }
    }

    public get roomWd(): number
    {
        return this._roomWd;
    }

    public set roomWd(width: number)
    {
        this._roomWd = width;
    }

    public get roomHt(): number
    {
        return this._roomHt;
    }

    public set roomHt(height: number)
    {
        this._roomHt = height;
    }

    public get geometryUpdateId(): number
    {
        return this._geometryUpdateId;
    }

    public set geometryUpdateId(updateId: number)
    {
        this._geometryUpdateId = updateId;
    }

    public get isMoving(): boolean
    {
        if(((!(this._targetLoc == null)) && (!(this._currentLoc == null))))
        {
            return true;
        }
        return false;
    }

    public set target(location: IVector3D)
    {
        let difference: IVector3D;
        if(this._targetLoc == null)
        {
            this._targetLoc = new Vector3d();
        }
        if((((!(this._targetLoc.x == location.x)) || (!(this._targetLoc.y == location.y))) || (!(this._targetLoc.z == location.z))))
        {
            this._targetLoc.assign(location);
            difference = Vector3d.dif(this._targetLoc, this._currentLoc);
            this._moveDistance = difference.length;
            this._maintainPreviousMoveSpeed = true;
        }
    }

    public dispose(): void
    {
        this._targetLoc = null;
        this._currentLoc = null;
    }

    public initializeLocation(location: IVector3D): void
    {
        if(this._currentLoc != null)
        {
            return;
        }
        this._currentLoc = new Vector3d();
        this._currentLoc.assign(location);
    }

    public resetLocation(location: IVector3D): void
    {
        if(this._currentLoc == null)
        {
            this._currentLoc = new Vector3d();
        }
        this._currentLoc.assign(location);
    }

    public update(time: number, speed: number): void
    {
        let difference: IVector3D;
        let speedFactor: number;
        let minSpeed: number;
        let maxSpeed: number;
        let moveSpeed: number;
        if((((this._followDuration > 0) && (!(this._targetLoc == null))) && (!(this._currentLoc == null))))
        {
            if(this._scaleChanged)
            {
                this._scaleChanged = false;
                this._currentLoc = this._targetLoc;
                this._targetLoc = null;
                return;
            }
            difference = Vector3d.dif(this._targetLoc, this._currentLoc);
            if(difference.length > this._moveDistance)
            {
                this._moveDistance = difference.length;
            }
            if(difference.length <= speed)
            {
                this._currentLoc = this._targetLoc;
                this._targetLoc = null;
                this._previousMoveSpeed = 0;
            }
            else
            {
                speedFactor = Math.sin(((Math.PI * difference.length) / this._moveDistance));
                minSpeed = (speed * 0.5);
                maxSpeed = (this._moveDistance / RoomCamera.MOVE_SPEED_DENOMINATOR);
                moveSpeed = (minSpeed + ((maxSpeed - minSpeed) * speedFactor));
                if(this._maintainPreviousMoveSpeed)
                {
                    if(moveSpeed < this._previousMoveSpeed)
                    {
                        moveSpeed = this._previousMoveSpeed;
                        if(moveSpeed > difference.length)
                        {
                            moveSpeed = difference.length;
                        }
                    }
                    else
                    {
                        this._maintainPreviousMoveSpeed = false;
                    }
                }
                this._previousMoveSpeed = moveSpeed;
                difference.divide(difference.length);
                difference.multiply(moveSpeed);
                this._currentLoc = Vector3d.sum(this._currentLoc, difference);
            }
        }
    }

    public reset(): void
    {
        this._geometryUpdateId = -1;
    }

    public activateFollowing(duration: number): void
    {
        this._followDuration = duration;
    }
}
