import { IFurnitureStackingHeightMap } from '@octane/api';

export class FurnitureStackingHeightMap implements IFurnitureStackingHeightMap
{
    private _width: number;
    private _height: number;
    private _heights: number[];
    private _isNotStackable: boolean[];
    private _isRoomTile: boolean[];

    constructor(width: number, height: number)
    {
        this._width = width;
        this._height = height;
        this._heights = [];
        this._isNotStackable = [];
        this._isRoomTile = [];

        let total = (width * height);

        while(total > 0)
        {
            this._heights.push(0);
            this._isNotStackable.push(false);
            this._isRoomTile.push(false);

            total--;
        }
    }

    public dispose(): void
    {
        this._width = 0;
        this._height = 0;
        this._height = null;
        this._isNotStackable = null;
        this._isRoomTile = null;
    }

    private validPosition(x: number, y: number): boolean
    {
        return (((x >= 0) && (x < this._width)) && (y >= 0)) && (y < this._height);
    }

    public getTileHeight(x: number, y: number): number
    {
        return ((this.validPosition(x, y)) ? this._heights[((y * this._width) + x)] : 0);
    }

    public setTileHeight(x: number, y: number, height: number): void
    {
        if(this.validPosition(x, y)) this._heights[((y * this._width) + x)] = height;
    }

    public setStackingBlocked(x: number, y: number, isNotStackable: boolean): void
    {
        if(this.validPosition(x, y)) this._isNotStackable[((y * this._width) + x)] = isNotStackable;
    }

    public setIsRoomTile(x: number, y: number, isRoomTile: boolean): void
    {
        if(this.validPosition(x, y)) this._isRoomTile[((y * this._width) + x)] = isRoomTile;
    }

    public validateLocation(x: number, y: number, sizeX: number, sizeY: number, areaX: number, areaY: number, areaWidth: number, areaHeight: number, stackable: boolean, altitude: number = -1): boolean
    {
        let column = 0;
        let index = 0;

        if(!this.validPosition(x, y) || !this.validPosition(((x + sizeX) - 1), ((y + sizeY) - 1))) return false;

        if(((areaX < 0) || (areaX >= this._width))) areaX = 0;

        if(((areaY < 0) || (areaY >= this._height))) areaY = 0;

        areaWidth = Math.min(areaWidth, (this._width - areaX));
        areaHeight = Math.min(areaHeight, (this._height - areaY));

        if(altitude === -1) altitude = this.getTileHeight(x, y);

        let row = y;

        while(row < (y + sizeY))
        {
            column = x;

            while(column < (x + sizeX))
            {
                if(((((column < areaX) || (column >= (areaX + areaWidth))) || (row < areaY)) || (row >= (areaY + areaHeight))))
                {
                    index = ((row * this._width) + column);

                    if(stackable)
                    {
                        if(!this._isRoomTile[index]) return false;
                    }
                    else
                    {
                        if(((this._isNotStackable[index]) || (!(this._isRoomTile[index]))) || (Math.abs((this._heights[index] - altitude)) > 0.01)) return false;
                    }
                }

                column++;
            }

            row++;
        }

        return true;
    }

    public get width(): number
    {
        return this._width;
    }

    public get height(): number
    {
        return this._height;
    }
}
