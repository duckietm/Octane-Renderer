import { ILegacyWallGeometry, IVector3D } from '@octane/api';
import { Vector3d } from '@octane/utils';

export class LegacyWallGeometry implements ILegacyWallGeometry
{
    public static DEFAULT_SCALE: number = 32;

    private static L: string = 'l';
    private static R: string = 'r';

    private _isDisposed: boolean;
    private _scale: number;
    private _heightMap: number[][];
    private _width: number;
    private _height: number;
    private _floorHeight: number;

    constructor()
    {
        this._isDisposed = false;
        this._scale = 64;
        this._heightMap = [];
        this._width = 0;
        this._height = 0;
        this._floorHeight = 0;
    }

    public get disposed(): boolean
    {
        return this._isDisposed;
    }

    public get scale(): number
    {
        return this._scale;
    }

    public set scale(scale: number)
    {
        this._scale = scale;
    }

    public dispose(): void
    {
        this.reset();
        this._isDisposed = true;
    }

    public initialize(width: number, height: number, floorHeight: number): void
    {
        if((width <= this._width) && (height <= this._height))
        {
            this._width = width;
            this._height = height;
            this._floorHeight = floorHeight;

            return;
        }

        this.reset();

        let y = 0;

        while(y < height)
        {
            const heights: number[] = [];

            this._heightMap.push(heights);

            let x = 0;

            while(x < width)
            {
                heights.push(0);

                x++;
            }

            y++;
        }

        this._width = width;
        this._height = height;
        this._floorHeight = floorHeight;
    }

    private reset(): void
    {
        this._heightMap = [];
    }

    public setHeight(x: number, y: number, height: number): boolean
    {
        if((((x < 0) || (x >= this._width)) || (y < 0)) || (y >= this._height)) return false;

        const heightMap = this._heightMap[y];

        if(!heightMap) return false;

        heightMap[x] = height;

        return true;
    }

    public getHeight(x: number, y: number): number
    {
        if((((x < 0) || (x >= this._width)) || (y < 0)) || (y >= this._height)) return 0;

        const heightMap = this._heightMap[y];

        if(!heightMap) return 0;

        return heightMap[x];
    }

    public getLocation(width: number, height: number, localX: number, localY: number, direction: string): IVector3D
    {
        let column: number;
        if(((width == 0) && (height == 0)))
        {
            width = this._width;
            height = this._height;
            const offset = Math.round((this.scale / 10));
            if(direction == LegacyWallGeometry.R)
            {
                let column = (this._width - 1);
                while(column >= 0)
                {
                    let row = 1;
                    while(row < this._height)
                    {
                        if(this.getHeight(column, row) <= this._floorHeight)
                        {
                            if((row - 1) < height)
                            {
                                width = column;
                                height = (row - 1);
                            }
                            break;
                        }
                        row++;
                    }
                    column--;
                }
                localY = (localY + ((this.scale / 4) - (offset / 2)));
                localX = (localX + (this.scale / 2));
            }
            else
            {
                let row = (this._height - 1);
                while(row >= 0)
                {
                    let column = 1;
                    while(column < this._width)
                    {
                        if(this.getHeight(column, row) <= this._floorHeight)
                        {
                            if((column - 1) < width)
                            {
                                width = (column - 1);
                                height = row;
                            }
                            break;
                        }
                        column++;
                    }
                    row--;
                }
                localY = (localY + ((this.scale / 4) - (offset / 2)));
                localX = (localX - offset);
            }
        }
        let locationX: number = width;
        let locationY: number = height;
        let altitude: number = this.getHeight(width, height);
        if(direction == LegacyWallGeometry.R)
        {
            locationX = (locationX + ((localX / (this._scale / 2)) - 0.5));
            locationY = (locationY + 0.5);
            altitude = (altitude - ((localY - (localX / 2)) / (this._scale / 2)));
        }
        else
        {
            locationY = (locationY + ((((this._scale / 2) - localX) / (this._scale / 2)) - 0.5));
            locationX = (locationX + 0.5);
            altitude = (altitude - ((localY - (((this._scale / 2) - localX) / 2)) / (this._scale / 2)));
        }
        const location: IVector3D = new Vector3d(locationX, locationY, altitude);
        return location;
    }

    public getLocationOldFormat(coordinate: number, offset: number, direction: string): IVector3D
    {
        let column: number;
        let row: number;
        let fraction = 0;
        let tileOffset = 0;
        row = Math.ceil(coordinate);
        fraction = (row - coordinate);
        let tileX: number;
        let tileY: number;
        let localY: number;
        let altitude = 0;
        column = 0;
        while(column < this._width)
        {
            if(((row >= 0) && (row < this._height)))
            {
                if(this.getHeight(column, row) <= this._floorHeight)
                {
                    tileX = (column - 1);
                    tileY = row;
                    tileOffset = column;
                    direction = LegacyWallGeometry.L;
                    break;
                }
                if(this.getHeight(column, (row + 1)) <= this._floorHeight)
                {
                    tileX = column;
                    tileY = row;
                    tileOffset = (tileY - coordinate);
                    direction = LegacyWallGeometry.R;
                    break;
                }
            }
            row++;
            column++;
        }
        const localX = ((this.scale / 2) * fraction);
        let verticalOffset: number = ((-(tileOffset) * this.scale) / 2);
        verticalOffset = (verticalOffset + ((((-(offset) * 18) / 32) * this.scale) / 2));
        altitude = this.getHeight(tileX, tileY);
        localY = (((altitude * this.scale) / 2) + verticalOffset);
        if(direction == LegacyWallGeometry.R)
        {
            localY = (localY + ((fraction * this.scale) / 4));
        }
        else
        {
            localY = (localY + (((1 - fraction) * this.scale) / 4));
        }
        return this.getLocation(tileX, tileY, localX, localY, direction);
    }

    public getOldLocation(location: IVector3D, direction: number): [number, number, number, number, string]
    {
        if(location == null)
        {
            return null;
        }
        let tileX = 0;
        let tileY = 0;
        let localX = 0;
        let localY = 0;
        let side = '';
        let altitude = 0;
        if(direction == 90)
        {
            tileX = Math.floor((location.x - 0.5));
            tileY = Math.floor((location.y + 0.5));
            altitude = this.getHeight(tileX, tileY);
            localX = ((this._scale / 2) - (((location.y - tileY) + 0.5) * (this._scale / 2)));
            localY = (((altitude - location.z) * (this._scale / 2)) + (((this._scale / 2) - localX) / 2));
            side = LegacyWallGeometry.L;
        }
        else
        {
            if(direction == 180)
            {
                tileX = Math.floor((location.x + 0.5));
                tileY = Math.floor((location.y - 0.5));
                altitude = this.getHeight(tileX, tileY);
                localX = (((location.x + 0.5) - tileX) * (this._scale / 2));
                localY = (((altitude - location.z) * (this._scale / 2)) + (localX / 2));
                side = LegacyWallGeometry.R;
            }
            else
            {
                return null;
            }
        }
        return [tileX, tileY, localX, localY, side];
    }

    public getOldLocationString(location: IVector3D, direction: number): string
    {
        const oldLocation = this.getOldLocation(location, direction);
        if(oldLocation == null)
        {
            return null;
        }
        const tileX: number = Math.trunc(oldLocation[0]);
        const tileY: number = Math.trunc(oldLocation[1]);
        const localX: number = Math.trunc(oldLocation[2]);
        const localY: number = Math.trunc(oldLocation[3]);
        const side: string = oldLocation[4];
        const result: string = (((((((((':w=' + tileX) + ',') + tileY) + ' l=') + localX) + ',') + localY) + ' ') + side);
        return result;
    }

    public getDirection(direction: string): number
    {
        if(direction == LegacyWallGeometry.R)
        {
            return 180;
        }
        return 90;
    }

    public getFloorAltitude(x: number, y: number): number
    {
        const altitude = this.getHeight(x, y);
        const neighbourAltitude = (altitude + 1);

        return altitude + (((((((((Math.trunc(this.getHeight((x - 1), (y - 1))) == neighbourAltitude) || (Math.trunc(this.getHeight(x, (y - 1))) == neighbourAltitude)) || (Math.trunc(this.getHeight((x + 1), (y - 1))) == neighbourAltitude)) || (Math.trunc(this.getHeight((x - 1), y)) == neighbourAltitude)) || (Math.trunc(this.getHeight((x + 1), y)) == neighbourAltitude)) || (Math.trunc(this.getHeight((x - 1), (y + 1))) == neighbourAltitude)) || (Math.trunc(this.getHeight(x, (y + 1))) == neighbourAltitude)) || (Math.trunc(this.getHeight((x + 1), (y + 1))) == neighbourAltitude)) ? 0.5 : 0);
    }

    public isRoomTile(x: number, y: number): boolean
    {
        return ((((x >= 0) && (x < this._width)) && (y >= 0)) && (y < this._height)) && (this._heightMap[y][x] >= 0);
    }
}
