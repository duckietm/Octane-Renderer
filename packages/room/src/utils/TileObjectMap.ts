import { IRoomObject, ITileObjectMap, RoomObjectVariable } from '@octane/api';
import { OctaneLogger } from '@octane/utils';

export class TileObjectMap implements ITileObjectMap
{
    private _tileObjectMap: Map<number, Map<number, IRoomObject>>;
    private _width: number;
    private _height: number;

    constructor(width: number, height: number)
    {
        this._tileObjectMap = new Map();

        let index = 0;

        while(index < height)
        {
            this._tileObjectMap.set(index, new Map());

            index++;
        }

        this._width = width;
        this._height = height;
    }

    public clear(): void
    {
        for(const row of this._tileObjectMap.values())
        {
            if(!row) continue;

            row.clear();
        }

        this._tileObjectMap.clear();
    }

    public populate(objects: IRoomObject[]): void
    {
        this.clear();

        for(const object of objects) this.addRoomObject(object);
    }

    public dispose(): void
    {
        this._tileObjectMap = null;
        this._width = 0;
        this._height = 0;
    }

    public getObjectIntTile(x: number, y: number): IRoomObject
    {
        if((((x >= 0) && (x < this._width)) && (y >= 0)) && (y < this._height))
        {
            const existing = this._tileObjectMap.get(y);

            if(existing) return existing.get(x);
        }

        return null;
    }

    public setObjectInTile(x: number, y: number, object: IRoomObject): void
    {
        if(!object.isReady)
        {
            OctaneLogger.log('Assigning non initialized object to tile object map!');

            return;
        }

        if((((x >= 0) && (x < this._width)) && (y >= 0)) && (y < this._height))
        {
            const existing = this._tileObjectMap.get(y);

            if(existing) existing.set(x, object);
        }
    }

    public addRoomObject(object: IRoomObject): void
    {
        if(!object || !object.model || !object.isReady) return;

        const location = object.getLocation();
        const direction = object.getDirection();

        if(!location || !direction) return;

        let sizeX = object.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_X);
        let sizeY = object.model.getValue<number>(RoomObjectVariable.FURNITURE_SIZE_Y);

        if(sizeX < 1) sizeX = 1;
        if(sizeY < 1) sizeY = 1;

        const directionNumber = ((Math.trunc((direction.x + 45)) % 360) / 90);

        if((directionNumber === 1) || (directionNumber === 3)) [sizeX, sizeY] = [sizeY, sizeX];

        let y = location.y;

        while(y < (location.y + sizeY))
        {
            let x = location.x;

            while(x < (location.x + sizeX))
            {
                const roomObject = this.getObjectIntTile(x, y);

                if((!(roomObject)) || ((!(roomObject === object)) && (roomObject.getLocation().z <= location.z)))
                {
                    this.setObjectInTile(x, y, object);
                }

                x++;
            }

            y++;
        }
    }
}
