import { IVector3D } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { Point } from 'pixi.js';

export class RoomWallData
{
    public static WALL_DIRECTION_VECTORS: Vector3d[] = [
        new Vector3d(1, 0, 0),
        new Vector3d(0, 1, 0),
        new Vector3d(-1, 0, 0),
        new Vector3d(0, -1, 0)
    ];

    public static WALL_NORMAL_VECTORS: Vector3d[] = [
        new Vector3d(0, 1, 0),
        new Vector3d(-1, 0, 0),
        new Vector3d(0, -1, 0),
        new Vector3d(1, 0, 0)
    ];

    private _corners: Point[];
    private _endPoints: Point[];
    private _directions: number[];
    private _lengths: number[];
    private _leftTurns: boolean[];
    private _borders: boolean[];
    private _hideWalls: boolean[];
    private _manuallyLeftCut: boolean[];
    private _manuallyRightCut: boolean[];
    private _addDuplicates: boolean;
    private _count: number;

    constructor()
    {
        this._corners = [];
        this._endPoints = [];
        this._directions = [];
        this._lengths = [];
        this._leftTurns = [];
        this._borders = [];
        this._hideWalls = [];
        this._manuallyLeftCut = [];
        this._manuallyRightCut = [];
        this._addDuplicates = false;
        this._count = 0;
    }

    public addWall(corner: Point, direction: number, length: number, border: boolean, leftTurn: boolean): void
    {
        if(((this._addDuplicates) || (this.checkIsNotDuplicate(corner, direction, length, border, leftTurn))))
        {
            this._corners.push(corner);
            this._directions.push(direction);
            this._lengths.push(length);
            this._borders.push(border);
            this._leftTurns.push(leftTurn);
            this._hideWalls.push(false);
            this._manuallyLeftCut.push(false);
            this._manuallyRightCut.push(false);
            this._count++;
        }
    }

    private checkIsNotDuplicate(corner: Point, direction: number, length: number, border: boolean, leftTurn: boolean): boolean
    {
        let index = 0;

        while(index < this._count)
        {
            if(((((((this._corners[index].x == corner.x) && (this._corners[index].y == corner.y)) && (this._directions[index] == direction)) && (this._lengths[index] == length)) && (this._borders[index] == border)) && (this._leftTurns[index] == leftTurn)))
            {
                return false;
            }
            index++;
        }
        return true;
    }

    public get count(): number
    {
        return this._count;
    }

    public getCorner(index: number): Point
    {
        return this._corners[index];
    }

    public getEndPoint(index: number): Point
    {
        this.calculateWallEndPoints();
        return this._endPoints[index];
    }

    public getLength(index: number): number
    {
        return this._lengths[index];
    }

    public getDirection(index: number): number
    {
        return this._directions[index];
    }

    public getBorder(index: number): boolean
    {
        return this._borders[index];
    }

    public getHideWall(index: number): boolean
    {
        return this._hideWalls[index];
    }

    public getLeftTurn(index: number): boolean
    {
        return this._leftTurns[index];
    }

    public getManuallyLeftCut(index: number): boolean
    {
        return this._manuallyLeftCut[index];
    }

    public getManuallyRightCut(index: number): boolean
    {
        return this._manuallyRightCut[index];
    }

    public setHideWall(index: number, hide: boolean): void
    {
        this._hideWalls[index] = hide;
    }

    public setLength(index: number, length: number): void
    {
        if(length < this._lengths[index])
        {
            this._lengths[index] = length;
            this._manuallyRightCut[index] = true;
        }
    }

    public moveCorner(index: number, offset: number): void
    {
        let directionVector: IVector3D;
        if(((offset > 0) && (offset < this._lengths[index])))
        {
            const corner = this._corners[index];

            directionVector = RoomWallData.WALL_DIRECTION_VECTORS[this.getDirection(index)];
            this._corners[index] = new Point((corner.x + (offset * directionVector.x)), (corner.y + (offset * directionVector.y)));
            this._lengths[index] = (this._lengths[index] - offset);
            this._manuallyLeftCut[index] = true;
        }
    }

    private calculateWallEndPoints(): void
    {
        let index: number;
        let corner: Point;
        let endPoint: Point;
        let directionVector: IVector3D;
        let length: number;
        if(this._endPoints.length != this.count)
        {
            this._endPoints = [];
            index = 0;
            while(index < this.count)
            {
                corner = this.getCorner(index);
                endPoint = new Point(corner.x, corner.y);
                directionVector = RoomWallData.WALL_DIRECTION_VECTORS[this.getDirection(index)];
                length = this.getLength(index);
                endPoint.x = (endPoint.x + (directionVector.x * length));
                endPoint.y = (endPoint.y + (directionVector.y * length));
                this._endPoints.push(endPoint);
                index++;
            }
        }
    }
}
