import { IVector3D } from '@octane/api';
import { Vector3d } from '@octane/utils';
import { Point } from 'pixi.js';
import { RoomFloorHole } from './RoomFloorHole';
import { RoomMapData } from './RoomMapData';
import { RoomPlaneData } from './RoomPlaneData';
import { RoomWallData } from './RoomWallData';

export class RoomPlaneParser
{
    public static TILE_BLOCKED: number = -110;
    public static TILE_HOLE: number = -100;
    private static FLOOR_THICKNESS: number = 0.25;
    private static WALL_THICKNESS: number = 0.25;
    private static MAX_WALL_ADDITIONAL_HEIGHT: number = 26;
    private _tileMatrix: number[][];
    private _tileMatrixOriginal: number[][];
    private _width: number = 0;
    private _height: number = 0;
    private _planes: RoomPlaneData[];
    private _highlights: RoomPlaneData[];
    private _fixedWallHeight: number = -1;
    private _floorHoles: Map<number, RoomFloorHole>;
    private _floorHolesInverted: Map<number, RoomFloorHole>;
    private _floorHoleMatrix: boolean[][];
    private floorTiles: number[][];

    constructor()
    {
        this._tileMatrix = [];
        this._tileMatrixOriginal = [];
        this._highlights = [];
        this._planes = [];
        this._floorHoleMatrix = [];
        this._wallHeight = 3.6;
        this._wallThicknessMultiplier = 1;
        this._floorThicknessMultiplier = 1;
        this._floorHoles = new Map();
        this._floorHolesInverted = new Map();
    }

    private _minX: number = 0;

    public get minX(): number
    {
        return this._minX;
    }

    private _maxX: number = 0;

    public get maxX(): number
    {
        return this._maxX;
    }

    private _minY: number = 0;

    public get minY(): number
    {
        return this._minY;
    }

    private _maxY: number = 0;

    public get maxY(): number
    {
        return this._maxY;
    }

    private _wallHeight: number;

    public get wallHeight(): number
    {
        if(this._fixedWallHeight != -1)
        {
            return this._fixedWallHeight + 3.6;
        }
        return this._wallHeight;
    }

    public set wallHeight(height: number)
    {
        if(height < 0)
        {
            height = 0;
        }
        this._wallHeight = height;
    }

    private _wallThicknessMultiplier: number;

    public get wallThicknessMultiplier(): number
    {
        return this._wallThicknessMultiplier;
    }

    public set wallThicknessMultiplier(multiplier: number)
    {
        if(multiplier < 0)
        {
            multiplier = 0;
        }
        this._wallThicknessMultiplier = multiplier;
    }

    private _floorThicknessMultiplier: number;

    public get floorThicknessMultiplier(): number
    {
        return this._floorThicknessMultiplier;
    }

    public set floorThicknessMultiplier(multiplier: number)
    {
        if(multiplier < 0)
        {
            multiplier = 0;
        }
        this._floorThicknessMultiplier = multiplier;
    }

    private _floorHeight: number = 0;

    public get floorHeight(): number
    {
        if(this._fixedWallHeight != -1)
        {
            return this._fixedWallHeight;
        }
        return this._floorHeight;
    }

    private _restrictsDragging: boolean;

    public get restrictsDragging(): boolean
    {
        return this._restrictsDragging;
    }

    public set restrictsDragging(flag: boolean)
    {
        this._restrictsDragging = flag;
    }

    private _restrictsScaling: boolean = false;

    public get restrictsScaling(): boolean
    {
        return this._restrictsScaling;
    }

    public set restrictsScaling(flag: boolean)
    {
        this._restrictsScaling = flag;
    }

    private _restrictedScale: number = 1;

    public get restrictedScale(): number
    {
        return this._restrictedScale;
    }

    public set restrictedScale(scale: number)
    {
        this._restrictedScale = scale;
    }

    public get tileMapWidth(): number
    {
        return this._width;
    }

    public get tileMapHeight(): number
    {
        return this._height;
    }

    public get planeCount(): number
    {
        return this._planes.length;
    }

    private static getFloorHeight(matricies: number[][]): number
    {
        const length = matricies.length;

        if(!length) return 0;

        let tileHeight = 0;

        let i = 0;

        while(i < length)
        {
            const matrix = matricies[i];

            let j = 0;

            while(j < matrix.length)
            {
                const height = matrix[j];

                if(height > tileHeight) tileHeight = height;

                j++;
            }

            i++;
        }

        return tileHeight;
    }

    private static findEntranceTile(matricies: number[][]): Point
    {
        if(!matricies) return null;

        const length = matricies.length;

        if(!length) return null;

        const entranceColumns: number[] = [];

        let i = 0;

        while(i < length)
        {
            const matrix = matricies[i];

            if(!matrix || !matrix.length) return null;

            let j = 0;

            while(j < matrix.length)
            {
                if(matrix[j] >= 0)
                {
                    entranceColumns.push(j);

                    break;
                }

                j++;
            }

            if(entranceColumns.length < (i + 1)) entranceColumns.push((matrix.length + 1));

            i++;
        }

        i = 1;

        while(i < (entranceColumns.length - 1))
        {
            if(((Math.trunc(entranceColumns[i]) <= (Math.trunc(entranceColumns[(i - 1)]) - 1)) && (Math.trunc(entranceColumns[i]) <= (Math.trunc(entranceColumns[(i + 1)]) - 1)))) return new Point(Math.trunc((entranceColumns[i]) | 0), i);

            i++;
        }

        return null;
    }

    private static expandFloorTiles(tiles: number[][]): number[][]
    {
        let col: number;
        let row: number;
        let subCol: number;
        let subRow: number;
        let expandedCol: number;
        let value: number;
        let baseHeight: number;
        let cornerA: number;
        let cornerB: number;
        let cornerC: number;
        let cornerD: number;
        let next: number;
        const rows = tiles.length;
        const columns: number = tiles[0].length;
        const expanded: number[][] = [];
        row = 0;
        while(row < (rows * 4))
        {
            expanded[row] = [];
            row++;
        }
        let expandedRow = 0;
        row = 0;
        while(row < rows)
        {
            expandedCol = 0;
            col = 0;
            while(col < columns)
            {
                value = tiles[row][col];
                if(((value < 0) || (value <= 0xFF)))
                {
                    subRow = 0;
                    while(subRow < 4)
                    {
                        subCol = 0;
                        while(subCol < 4)
                        {
                            if(expanded[(expandedRow + subRow)] === undefined) expanded[(expandedRow + subRow)] = [];

                            expanded[(expandedRow + subRow)][(expandedCol + subCol)] = ((value < 0) ? value : (value * 4));
                            subCol++;
                        }
                        subRow++;
                    }
                }
                else
                {
                    baseHeight = ((value & 0xFF) * 4);
                    cornerA = (baseHeight + (((value >> 11) & 0x01) * 3));
                    cornerB = (baseHeight + (((value >> 10) & 0x01) * 3));
                    cornerC = (baseHeight + (((value >> 9) & 0x01) * 3));
                    cornerD = (baseHeight + (((value >> 8) & 0x01) * 3));
                    subCol = 0;
                    while(subCol < 3)
                    {
                        next = (subCol + 1);
                        expanded[expandedRow][(expandedCol + subCol)] = (((cornerA * (3 - subCol)) + (cornerB * subCol)) / 3);
                        expanded[(expandedRow + 3)][(expandedCol + next)] = (((cornerC * (3 - next)) + (cornerD * next)) / 3);
                        expanded[(expandedRow + next)][expandedCol] = (((cornerA * (3 - next)) + (cornerC * next)) / 3);
                        expanded[(expandedRow + subCol)][(expandedCol + 3)] = (((cornerB * (3 - subCol)) + (cornerD * subCol)) / 3);
                        subCol++;
                    }
                    expanded[(expandedRow + 1)][(expandedCol + 1)] = ((cornerA > baseHeight) ? (baseHeight + 2) : (baseHeight + 1));
                    expanded[(expandedRow + 1)][(expandedCol + 2)] = ((cornerB > baseHeight) ? (baseHeight + 2) : (baseHeight + 1));
                    expanded[(expandedRow + 2)][(expandedCol + 1)] = ((cornerC > baseHeight) ? (baseHeight + 2) : (baseHeight + 1));
                    expanded[(expandedRow + 2)][(expandedCol + 2)] = ((cornerD > baseHeight) ? (baseHeight + 2) : (baseHeight + 1));
                }
                expandedCol = (expandedCol + 4);
                col++;
            }
            expandedRow = (expandedRow + 4);
            row++;
        }
        return expanded;
    }

    private static addTileTypes(heightMap: number[][]): void
    {
        let col: number;
        let value: number;
        let nw: number;
        let n: number;
        let ne: number;
        let w: number;
        let e: number;
        let sw: number;
        let s: number;
        let se: number;
        let higher: number;
        let lower: number;
        let mask: number;
        const maxRow: number = (heightMap.length - 1);
        const maxCol: number = (heightMap[0].length - 1);
        let row = 1;
        while(row < maxRow)
        {
            col = 1;
            while(col < maxCol)
            {
                value = heightMap[row][col];
                if(value < 0)
                {
                    //
                }
                else
                {
                    nw = (heightMap[(row - 1)][(col - 1)] & 0xFF);
                    n = (heightMap[(row - 1)][col] & 0xFF);
                    ne = (heightMap[(row - 1)][(col + 1)] & 0xFF);
                    w = (heightMap[row][(col - 1)] & 0xFF);
                    e = (heightMap[row][(col + 1)] & 0xFF);
                    sw = (heightMap[(row + 1)][(col - 1)] & 0xFF);
                    s = (heightMap[(row + 1)][col] & 0xFF);
                    se = (heightMap[(row + 1)][(col + 1)] & 0xFF);
                    higher = (value + 1);
                    lower = (value - 1);
                    mask = (((((((nw == higher) || (n == higher)) || (w == higher)) ? 8 : 0) | ((((ne == higher) || (n == higher)) || (e == higher)) ? 4 : 0)) | ((((sw == higher) || (s == higher)) || (w == higher)) ? 2 : 0)) | ((((se == higher) || (s == higher)) || (e == higher)) ? 1 : 0));
                    if(mask == 15)
                    {
                        mask = 0;
                    }
                    heightMap[row][col] = (value | (mask << 8));
                }
                col++;
            }
            row++;
        }
    }

    private static unpadHeightMap(heightMap: number[][]): void
    {
        heightMap.shift();
        heightMap.pop();

        for(const row of heightMap)
        {
            row.shift();
            row.pop();
        }
    }

    private static padHeightMap(heightMap: number[][]): void
    {
        const topRow: number[] = [];
        const bottomRow: number[] = [];
        for(const row of heightMap)
        {
            row.push(RoomPlaneParser.TILE_BLOCKED);
            row.unshift(RoomPlaneParser.TILE_BLOCKED);
        }
        for(const column of heightMap[0])
        {
            topRow.push(RoomPlaneParser.TILE_BLOCKED);
            bottomRow.push(RoomPlaneParser.TILE_BLOCKED);
        }
        heightMap.push(bottomRow);
        heightMap.unshift(topRow);
    }

    public dispose(): void
    {
        this._planes = null;
        this._tileMatrix = null;
        this._tileMatrixOriginal = null;
        this._floorHoleMatrix = null;
        if(this._floorHoles != null)
        {
            this._floorHoles.clear();
            this._floorHoles = null;
        }
        if(this._floorHolesInverted != null)
        {
            this._floorHolesInverted.clear();
            this._floorHolesInverted = null;
        }
    }

    public reset(): void
    {
        this._planes = [];
        this._tileMatrix = [];
        this._tileMatrixOriginal = [];
        this._width = 0;
        this._height = 0;
        this._minX = 0;
        this._maxX = 0;
        this._minY = 0;
        this._maxY = 0;
        this._floorHeight = 0;
        this._floorHoleMatrix = [];
    }

    public initializeTileMap(width: number, height: number): boolean
    {
        if(width < 0) width = 0;

        if(height < 0) height = 0;

        this._tileMatrix = [];
        this._tileMatrixOriginal = [];
        this._floorHoleMatrix = [];

        let y = 0;

        while(y < height)
        {
            const tileMatrix = [];
            const tileMatrixOriginal = [];
            const floorHoleMatrix = [];

            let x = 0;

            while(x < width)
            {
                tileMatrix[x] = RoomPlaneParser.TILE_BLOCKED;
                tileMatrixOriginal[x] = RoomPlaneParser.TILE_BLOCKED;
                floorHoleMatrix[x] = false;

                x++;
            }

            this._tileMatrix.push(tileMatrix);
            this._tileMatrixOriginal.push(tileMatrixOriginal);
            this._floorHoleMatrix.push(floorHoleMatrix);

            y++;
        }

        this._width = width;
        this._height = height;
        this._minX = this._width;
        this._maxX = -1;
        this._minY = this._height;
        this._maxY = -1;

        return true;
    }

    public setTileHeight(x: number, y: number, height: number): boolean
    {
        let row: number[];
        let foundInColumn: boolean;
        let checkY: number;
        let foundInRow: boolean;
        let checkX: number;
        if(((((x >= 0) && (x < this._width)) && (y >= 0)) && (y < this._height)))
        {
            row = this._tileMatrix[y];

            row[x] = height;
            if(height >= 0)
            {
                if(x < this._minX)
                {
                    this._minX = x;
                }
                if(x > this._maxX)
                {
                    this._maxX = x;
                }
                if(y < this._minY)
                {
                    this._minY = y;
                }
                if(y > this._maxY)
                {
                    this._maxY = y;
                }
            }
            else
            {
                if(((x == this._minX) || (x == this._maxX)))
                {
                    foundInColumn = false;
                    checkY = this._minY;
                    while(checkY < this._maxY)
                    {
                        if(this.getTileHeightInternal(x, checkY) >= 0)
                        {
                            foundInColumn = true;
                            break;
                        }
                        checkY++;
                    }
                    if(!foundInColumn)
                    {
                        if(x == this._minX)
                        {
                            this._minX++;
                        }
                        if(x == this._maxX)
                        {
                            this._maxX--;
                        }
                    }
                }
                if(((y == this._minY) || (y == this._maxY)))
                {
                    foundInRow = false;
                    checkX = this._minX;
                    while(checkX < this._maxX)
                    {
                        if(this.getTileHeight(checkX, y) >= 0)
                        {
                            foundInRow = true;
                            break;
                        }
                        checkX++;
                    }
                    if(!foundInRow)
                    {
                        if(y == this._minY)
                        {
                            this._minY++;
                        }
                        if(y == this._maxY)
                        {
                            this._maxY--;
                        }
                    }
                }
            }
            return true;
        }
        return false;
    }

    public getTileHeight(x: number, y: number): number
    {
        if(((((x < 0) || (x >= this._width)) || (y < 0)) || (y >= this._height)))
        {
            return RoomPlaneParser.TILE_BLOCKED;
        }

        const row = this._tileMatrix[y];

        if(row[x] === undefined) return 0;

        return Math.abs(row[x]);
    }

    public initializeFromTileData(fixedWallHeight: number = -1): boolean
    {
        let x: number;
        let y: number;
        this._fixedWallHeight = fixedWallHeight;
        y = 0;
        while(y < this._height)
        {
            x = 0;
            while(x < this._width)
            {
                if(this._tileMatrixOriginal[y] === undefined) this._tileMatrixOriginal[y] = [];
                this._tileMatrixOriginal[y][x] = this._tileMatrix[y][x];
                x++;
            }
            y++;
        }
        const entranceTile: Point = (() =>
        {
            const matrixWithFloorHoles = this._tileMatrix.map((row, rowIndex) =>
            {
                const floorHoleRow = this._floorHoleMatrix[rowIndex] || [];

                return row.map((value, columnIndex) => (floorHoleRow[columnIndex] ? RoomPlaneParser.TILE_HOLE : value));
            });

            return RoomPlaneParser.findEntranceTile(matrixWithFloorHoles);
        })();

        y = 0;
        while(y < this._height)
        {
            x = 0;
            while(x < this._width)
            {
                if(this._floorHoleMatrix[y] === undefined) this._floorHoleMatrix[y] = [];
                if(this._floorHoleMatrix[y][x])
                {
                    this.setTileHeight(x, y, RoomPlaneParser.TILE_HOLE);
                }
                x++;
            }
            y++;
        }

        return this.initialize(entranceTile);
    }

    public initializeHighlightArea(x: number, y: number, width: number, height: number): void
    {
        this.clearHighlightArea();
        this.extractPlanes(this.floorTiles, x * 4, y * 4, width * 4, height * 4, true);
    }

    public clearHighlightArea(): number
    {
        const highLightsLength: number = this._highlights.length;
        this._planes = this._planes.slice(0, this._planes.length - this._highlights.length);
        this._highlights.length = 0;
        return highLightsLength;
    }

    public initializeFromMapData(data: RoomMapData): boolean
    {
        if(!data) return false;

        this.reset();

        this.resetFloorHoles();

        const width = data.width;
        const height = data.height;
        const wallHeight = data.wallHeight;
        const fixedWallsHeight = data.fixedWallsHeight;

        this.initializeTileMap(width, height);

        if(data.tileMap)
        {
            let y = 0;

            while(y < data.tileMap.length)
            {
                const row = data.tileMap[y];

                if(row)
                {
                    let x = 0;

                    while(x < row.length)
                    {
                        const column = row[x];

                        if(column) this.setTileHeight(x, y, column.height);

                        x++;
                    }
                }

                y++;
            }
        }

        if(data.holeMap && data.holeMap.length)
        {
            let index = 0;

            while(index < data.holeMap.length)
            {
                const hole = data.holeMap[index];

                if(!hole) continue;

                this.addFloorHole(hole.id, hole.x, hole.y, hole.width, hole.height, hole.invert);

                index++;
            }

            this.initializeHoleMap();
        }

        this.wallHeight = wallHeight;

        this.initializeFromTileData(fixedWallsHeight);

        return true;
    }

    public isPlaneTemporaryHighlighter(planeIndex: number): boolean
    {
        if(planeIndex < 0 || planeIndex >= this.planeCount)
        {
            return false;
        }

        const planeData: RoomPlaneData = this._planes[planeIndex];

        if(planeData == null)
        {
            return false;
        }

        return this._highlights.indexOf(planeData) != -1;
    }

    public getMapData(): RoomMapData
    {
        const data = new RoomMapData();

        data.width = this._width;
        data.height = this._height;
        data.wallHeight = this._wallHeight;
        data.fixedWallsHeight = this._fixedWallHeight;
        data.dimensions.minX = this.minX;
        data.dimensions.maxX = this.maxX;
        data.dimensions.minY = this.minY;
        data.dimensions.maxY = this.maxY;

        let y = 0;

        while(y < this._height)
        {
            const tileRow: { height: number }[] = [];
            const tileMatrix = this._tileMatrixOriginal[y];

            let x = 0;

            while(x < this._width)
            {
                const tileHeight = tileMatrix[x];

                tileRow.push({ height: tileHeight });

                x++;
            }

            data.tileMap.push(tileRow);

            y++;
        }

        for(const [ holeId, holeData ] of this._floorHoles.entries())
        {
            if(!holeData) continue;

            data.holeMap.push({
                id: holeId,
                x: holeData.x,
                y: holeData.y,
                width: holeData.width,
                height: holeData.height,
                invert: false,
            });
        }

        for(const [ holeId, holeData ] of this._floorHolesInverted.entries())
        {
            if(!holeData) continue;

            data.holeMap.push({
                id: holeId,
                x: holeData.x,
                y: holeData.y,
                width: holeData.width,
                height: holeData.height,
                invert: true,
            });
        }

        return data;
    }

    public getPlaneLocation(planeIndex: number): IVector3D
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return null;

        const planeData = this._planes[planeIndex];

        if(!planeData) return null;

        return planeData.loc;
    }

    public getPlaneNormal(planeIndex: number): IVector3D
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return null;

        const planeData = this._planes[planeIndex];

        if(!planeData) return null;

        return planeData.normal;
    }

    public getPlaneLeftSide(planeIndex: number): IVector3D
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return null;

        const planeData = this._planes[planeIndex];

        if(!planeData) return null;

        return planeData.leftSide;
    }

    public getPlaneRightSide(planeIndex: number): IVector3D
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return null;

        const planeData = this._planes[planeIndex];

        if(!planeData) return null;

        return planeData.rightSide;
    }

    public getPlaneNormalDirection(planeIndex: number): IVector3D
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return null;

        const planeData = this._planes[planeIndex];

        if(!planeData) return null;

        return planeData.normalDirection;
    }

    public getPlaneSecondaryNormals(planeIndex: number): IVector3D[]
    {
        let normals: IVector3D[];
        let i: number;
        if(((planeIndex < 0) || (planeIndex >= this.planeCount)))
        {
            return null;
        }
        const planeData: RoomPlaneData = (this._planes[planeIndex]);
        if(planeData != null)
        {
            normals = [];
            i = 0;
            while(i < planeData.secondaryNormalCount)
            {
                normals.push(planeData.getSecondaryNormal(i));
                i++;
            }
            return normals;
        }
        return null;
    }

    public getPlaneType(planeIndex: number): number
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return RoomPlaneData.PLANE_UNDEFINED;

        const planeData = this._planes[planeIndex];

        if(!planeData) return RoomPlaneData.PLANE_UNDEFINED;

        return planeData.type;
    }

    public getPlaneMaskCount(planeIndex: number): number
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return 0;

        const planeData = this._planes[planeIndex];

        if(!planeData) return 0;

        return planeData.maskCount;
    }

    public getPlaneMaskLeftSideLoc(planeIndex: number, maskIndex: number): number
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return -1;

        const planeData = this._planes[planeIndex];

        if(!planeData) return -1;

        return planeData.getMaskLeftSideLoc(maskIndex);
    }

    public getPlaneMaskRightSideLoc(planeIndex: number, maskIndex: number): number
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return -1;

        const planeData = this._planes[planeIndex];

        if(!planeData) return -1;

        return planeData.getMaskRightSideLoc(maskIndex);
    }

    public getPlaneMaskLeftSideLength(planeIndex: number, maskIndex: number): number
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return -1;

        const planeData = this._planes[planeIndex];

        if(!planeData) return -1;

        return planeData.getMaskLeftSideLength(maskIndex);
    }

    public getPlaneMaskRightSideLength(planeIndex: number, maskIndex: number): number
    {
        if(((planeIndex < 0) || (planeIndex >= this.planeCount))) return -1;

        const planeData = this._planes[planeIndex];

        if(!planeData) return -1;

        return planeData.getMaskRightSideLength(maskIndex);
    }

    public addFloorHole(id: number, x: number, y: number, width: number, height: number, invert: boolean = false): void
    {
        this.removeFloorHole(id);

        if(invert)
        {
            this._floorHolesInverted.set(id, new RoomFloorHole(x, y, width, height));
        }
        else
        {
            this._floorHoles.set(id, new RoomFloorHole(x, y, width, height));
        }

    }

    public removeFloorHole(id: number): void
    {
        this._floorHoles.delete(id);
        this._floorHolesInverted.delete(id);
    }

    public resetFloorHoles(): void
    {
        this._floorHoles.clear();
        this._floorHolesInverted.clear();
    }

    private getTileHeightOriginal(x: number, y: number): number
    {
        if(((((x < 0) || (x >= this._width)) || (y < 0)) || (y >= this._height)))
        {
            return RoomPlaneParser.TILE_BLOCKED;
        }
        if(this._floorHoleMatrix[y][x])
        {
            return RoomPlaneParser.TILE_HOLE;
        }
        const row = this._tileMatrixOriginal[y];
        return row[x];
    }

    private getTileHeightInternal(x: number, y: number): number
    {
        if(((((x < 0) || (x >= this._width)) || (y < 0)) || (y >= this._height)))
        {
            return RoomPlaneParser.TILE_BLOCKED;
        }
        const row = this._tileMatrix[y];
        return row[x];
    }

    private initialize(entranceTile: Point): boolean
    {
        let entranceHeight = 0;
        if(entranceTile != null)
        {
            entranceHeight = this.getTileHeight(entranceTile.x, entranceTile.y);
            this.setTileHeight(entranceTile.x, entranceTile.y, RoomPlaneParser.TILE_BLOCKED);
        }
        this._floorHeight = RoomPlaneParser.getFloorHeight(this._tileMatrix);
        this.createWallPlanes();
        const heightMap: number[][] = [];

        for(const row of this._tileMatrix) heightMap.push(row.concat());

        RoomPlaneParser.padHeightMap(heightMap);
        RoomPlaneParser.addTileTypes(heightMap);
        RoomPlaneParser.unpadHeightMap(heightMap);
        this.floorTiles = RoomPlaneParser.expandFloorTiles(heightMap);
        this.extractPlanes(this.floorTiles);
        if(entranceTile != null)
        {
            this.setTileHeight(entranceTile.x, entranceTile.y, entranceHeight);
            this.addFloor(new Vector3d((entranceTile.x + 0.5), (entranceTile.y + 0.5), entranceHeight), new Vector3d(-1, 0, 0), new Vector3d(0, -1, 0), false, false, false, false);
        }

        return true;
    }

    private generateWallData(startCorner: Point, useHoles: boolean): RoomWallData
    {
        let isBorder: boolean;
        let isLeftTurn: boolean;
        let startDirection: number;
        let next: Point;
        let length: number;
        const wallData: RoomWallData = new RoomWallData();
        const extractors: Function[] = [ this.extractTopWall.bind(this), this.extractRightWall.bind(this), this.extractBottomWall.bind(this), this.extractLeftWall.bind(this) ];
        let direction = 0;
        let current: Point = new Point(startCorner.x, startCorner.y);
        let iterations = 0;
        while(iterations++ < 1000)
        {
            isBorder = false;
            isLeftTurn = false;
            startDirection = direction;
            if(((((current.x < this.minX) || (current.x > this.maxX)) || (current.y < this.minY)) || (current.y > this.maxY)))
            {
                isBorder = true;
            }
            next = extractors[direction](current, useHoles);
            if(next == null)
            {
                return null;
            }
            length = (Math.abs((next.x - current.x)) + Math.abs((next.y - current.y)));
            if(((current.x == next.x) || (current.y == next.y)))
            {
                direction = (((direction - 1) + extractors.length) % extractors.length);
                length = (length + 1);
                isLeftTurn = true;
            }
            else
            {
                direction = ((direction + 1) % extractors.length);
                length--;
            }
            wallData.addWall(current, startDirection, length, isBorder, isLeftTurn);
            if((((next.x == startCorner.x) && (next.y == startCorner.y)) && ((!(next.x == current.x)) || (!(next.y == current.y)))))
            {
                break;
            }
            current = next;
        }
        if(wallData.count == 0)
        {
            return null;
        }
        return wallData;
    }

    private hidePeninsulaWallChains(wallData: RoomWallData): void
    {
        let chainEnd: number;
        let turnDepth: number;
        let shouldHide: boolean;
        let hideIndex: number;
        let index = 0;
        const count: number = wallData.count;
        while(index < count)
        {
            const chainStart = index;

            chainEnd = index;
            turnDepth = 0;
            shouldHide = false;
            while(((!(wallData.getBorder(index))) && (index < count)))
            {
                if(wallData.getLeftTurn(index))
                {
                    turnDepth++;
                }
                else
                {
                    if(turnDepth > 0)
                    {
                        turnDepth--;
                    }
                }
                if(turnDepth > 1)
                {
                    shouldHide = true;
                }
                chainEnd = index;
                index++;
            }
            if(shouldHide)
            {
                hideIndex = chainStart;
                while(hideIndex <= chainEnd)
                {
                    wallData.setHideWall(hideIndex, true);
                    hideIndex++;
                }
            }
            index++;
        }
    }

    private updateWallsNextToHoles(wallData: RoomWallData): void
    {
        let corner: Point;
        let direction: number;
        let length: number;
        let directionVector: IVector3D;
        let normalVector: IVector3D;
        let holeCount: number;
        let offset: number;
        const count: number = wallData.count;
        let index = 0;
        while(index < count)
        {
            if(!wallData.getHideWall(index))
            {
                corner = wallData.getCorner(index);
                direction = wallData.getDirection(index);
                length = wallData.getLength(index);
                directionVector = RoomWallData.WALL_DIRECTION_VECTORS[direction];
                normalVector = RoomWallData.WALL_NORMAL_VECTORS[direction];
                holeCount = 0;
                offset = 0;
                while(offset < length)
                {
                    if(this.getTileHeightInternal(((corner.x + (offset * directionVector.x)) - normalVector.x), ((corner.y + (offset * directionVector.y)) - normalVector.y)) == RoomPlaneParser.TILE_HOLE)
                    {
                        if(((offset > 0) && (holeCount == 0)))
                        {
                            wallData.setLength(index, offset);
                            break;
                        }
                        holeCount++;
                    }
                    else
                    {
                        if(holeCount > 0)
                        {
                            wallData.moveCorner(index, holeCount);
                            break;
                        }
                    }
                    offset++;
                }
                if(holeCount == length)
                {
                    wallData.setHideWall(index, true);
                }
            }
            index++;
        }
    }

    private resolveOriginalWallIndex(startPoint: Point, endPoint: Point, wallData: RoomWallData): number
    {
        let corner: Point;
        let wallEnd: Point;
        let cornerMinY: number;
        let cornerMaxY: number;
        let cornerMinX: number;
        let cornerMaxX: number;
        const minY: number = Math.min(startPoint.y, endPoint.y);
        const maxY: number = Math.max(startPoint.y, endPoint.y);
        const minX: number = Math.min(startPoint.x, endPoint.x);
        const maxX: number = Math.max(startPoint.x, endPoint.x);
        const count: number = wallData.count;
        let index = 0;
        while(index < count)
        {
            corner = wallData.getCorner(index);
            wallEnd = wallData.getEndPoint(index);
            if(startPoint.x == endPoint.x)
            {
                if(((corner.x == startPoint.x) && (wallEnd.x == startPoint.x)))
                {
                    cornerMinY = Math.min(corner.y, wallEnd.y);
                    cornerMaxY = Math.max(corner.y, wallEnd.y);
                    if(((cornerMinY <= minY) && (maxY <= cornerMaxY)))
                    {
                        return index;
                    }
                }
            }
            else
            {
                if(startPoint.y == endPoint.y)
                {
                    if(((corner.y == startPoint.y) && (wallEnd.y == startPoint.y)))
                    {
                        cornerMinX = Math.min(corner.x, wallEnd.x);
                        cornerMaxX = Math.max(corner.x, wallEnd.x);
                        if(((cornerMinX <= minX) && (maxX <= cornerMaxX)))
                        {
                            return index;
                        }
                    }
                }
            }
            index++;
        }
        return -1;
    }

    private hideOriginallyHiddenWalls(wallData: RoomWallData, originalWallData: RoomWallData): void
    {
        let corner: Point;
        let endPoint: Point;
        let directionVector: IVector3D;
        let length: number;
        let originalIndex: number;
        const count: number = wallData.count;
        let index = 0;
        while(index < count)
        {
            if(!wallData.getHideWall(index))
            {
                corner = wallData.getCorner(index);
                endPoint = new Point(corner.x, corner.y);
                directionVector = RoomWallData.WALL_DIRECTION_VECTORS[wallData.getDirection(index)];
                length = wallData.getLength(index);
                endPoint.x = (endPoint.x + (directionVector.x * length));
                endPoint.y = (endPoint.y + (directionVector.y * length));
                originalIndex = this.resolveOriginalWallIndex(corner, endPoint, originalWallData);
                if(originalIndex >= 0)
                {
                    if(originalWallData.getHideWall(originalIndex))
                    {
                        wallData.setHideWall(index, true);
                    }
                }
                else
                {
                    wallData.setHideWall(index, true);
                }
            }
            index++;
        }
    }

    private checkWallHiding(wallData: RoomWallData, originalWallData: RoomWallData): void
    {
        this.hidePeninsulaWallChains(originalWallData);
        this.updateWallsNextToHoles(wallData);
        this.hideOriginallyHiddenWalls(wallData, originalWallData);
    }

    private addWalls(wallData: RoomWallData, originalWallData: RoomWallData): void
    {
        const count = wallData.count;
        const originalCount = originalWallData.count;
        let index = 0;

        while(index < count)
        {
            if(!wallData.getHideWall(index))
            {
                const corner = wallData.getCorner(index);
                const direction = wallData.getDirection(index);
                const length = wallData.getLength(index);
                const directionVector = RoomWallData.WALL_DIRECTION_VECTORS[direction];
                const normalVector = RoomWallData.WALL_NORMAL_VECTORS[direction];
                let minHeight = -1;
                let offset = 0;

                while(offset < length)
                {
                    const tileHeight = this.getTileHeightInternal(((corner.x + (offset * directionVector.x)) + normalVector.x), ((corner.y + (offset * directionVector.y)) + normalVector.y));

                    if(((tileHeight >= 0) && ((tileHeight < minHeight) || (minHeight < 0))))
                    {
                        minHeight = tileHeight;
                    }

                    offset++;
                }

                const baseZ = minHeight;

                let location = new Vector3d(corner.x, corner.y, baseZ);
                location = Vector3d.sum(location, Vector3d.product(normalVector, 0.5));
                location = Vector3d.sum(location, Vector3d.product(directionVector, -0.5));

                const heightExtent = ((this.wallHeight + Math.min(RoomPlaneParser.MAX_WALL_ADDITIONAL_HEIGHT, this.floorHeight)) - minHeight);
                const lengthVector = Vector3d.product(directionVector, -(length));
                const heightVector = new Vector3d(0, 0, heightExtent);

                location = Vector3d.dif(location, lengthVector);

                const originalIndex = this.resolveOriginalWallIndex(corner, wallData.getEndPoint(index), originalWallData);

                let nextDirection = 0;
                let prevDirection = 0;

                if(originalIndex >= 0)
                {
                    nextDirection = originalWallData.getDirection(((originalIndex + 1) % originalCount));
                    prevDirection = originalWallData.getDirection((((originalIndex - 1) + originalCount) % originalCount));
                }
                else
                {
                    nextDirection = wallData.getDirection(((index + 1) % count));
                    prevDirection = wallData.getDirection((((index - 1) + count) % count));
                }

                let cornerNormal = null;

                if((((nextDirection - direction) + 4) % 4) == 3)
                {
                    cornerNormal = RoomWallData.WALL_NORMAL_VECTORS[nextDirection];
                }
                else
                {
                    if((((direction - prevDirection) + 4) % 4) == 3)
                    {
                        cornerNormal = RoomWallData.WALL_NORMAL_VECTORS[prevDirection];
                    }
                }

                const leftTurn = wallData.getLeftTurn(index);
                const prevLeftTurn = wallData.getLeftTurn((((index - 1) + count) % count));
                const nextHidden = wallData.getHideWall(((index + 1) % count));
                const manuallyLeftCut = wallData.getManuallyLeftCut(index);
                const manuallyRightCut = wallData.getManuallyRightCut(index);

                this.addWall(location, lengthVector, heightVector, cornerNormal, ((!(prevLeftTurn)) || (manuallyLeftCut)), ((!(leftTurn)) || (manuallyRightCut)), (!(nextHidden)));
            }

            index++;
        }
    }

    private createWallPlanes(): boolean
    {
        let innerCount: number;
        let outerCount: number;
        const tileMatrix = this._tileMatrix;
        if(tileMatrix == null)
        {
            return false;
        }
        let x: number;
        let y: number;
        let row: number[];
        const rowCount: number = tileMatrix.length;
        let minColumns = 0;
        if(rowCount == 0)
        {
            return false;
        }
        x = 0;
        while(x < rowCount)
        {
            row = tileMatrix[x];
            if(((row == null) || (row.length == 0)))
            {
                return false;
            }
            if(minColumns > 0)
            {
                minColumns = Math.min(minColumns, row.length);
            }
            else
            {
                minColumns = row.length;
            }
            x++;
        }
        const additionalHeight: number = Math.min(RoomPlaneParser.MAX_WALL_ADDITIONAL_HEIGHT, ((this._fixedWallHeight != -1) ? this._fixedWallHeight : RoomPlaneParser.getFloorHeight(tileMatrix)));
        const startX: number = this.minX;
        let startY: number = this.minY;
        startY = this.minY;
        while(startY <= this.maxY)
        {
            if(this.getTileHeightInternal(startX, startY) > RoomPlaneParser.TILE_HOLE)
            {
                startY--;
                break;
            }
            startY++;
        }
        if(startY > this.maxY)
        {
            return false;
        }
        const startPoint: Point = new Point(startX, startY);
        const innerWallData: RoomWallData = this.generateWallData(startPoint, true);
        const outerWallData: RoomWallData = this.generateWallData(startPoint, false);
        if(innerWallData != null)
        {
            innerCount = innerWallData.count;
            outerCount = outerWallData.count;
            this.checkWallHiding(innerWallData, outerWallData);
            this.addWalls(innerWallData, outerWallData);
        }
        y = 0;
        while(y < this.tileMapHeight)
        {
            x = 0;
            while(x < this.tileMapWidth)
            {
                if(this.getTileHeightInternal(x, y) < 0)
                {
                    this.setTileHeight(x, y, -(additionalHeight + this.wallHeight));
                }
                x++;
            }
            y++;
        }
        return true;
    }

    private extractTopWall(corner: Point, useHoles: boolean): Point
    {
        if(corner == null)
        {
            return null;
        }
        let step = 1;
        let threshold: number = RoomPlaneParser.TILE_HOLE;
        if(!useHoles)
        {
            threshold = RoomPlaneParser.TILE_BLOCKED;
        }
        while(step < 1000)
        {
            if(this.getTileHeightInternal((corner.x + step), corner.y) > threshold)
            {
                return new Point(((corner.x + step) - 1), corner.y);
            }
            if(this.getTileHeightInternal((corner.x + step), (corner.y + 1)) <= threshold)
            {
                return new Point((corner.x + step), (corner.y + 1));
            }
            step++;
        }
        return null;
    }

    private extractRightWall(corner: Point, useHoles: boolean): Point
    {
        if(corner == null)
        {
            return null;
        }
        let step = 1;
        let threshold: number = RoomPlaneParser.TILE_HOLE;
        if(!useHoles)
        {
            threshold = RoomPlaneParser.TILE_BLOCKED;
        }
        while(step < 1000)
        {
            if(this.getTileHeightInternal(corner.x, (corner.y + step)) > threshold)
            {
                return new Point(corner.x, (corner.y + (step - 1)));
            }
            if(this.getTileHeightInternal((corner.x - 1), (corner.y + step)) <= threshold)
            {
                return new Point((corner.x - 1), (corner.y + step));
            }
            step++;
        }
        return null;
    }

    private extractBottomWall(corner: Point, useHoles: boolean): Point
    {
        if(corner == null)
        {
            return null;
        }
        let step = 1;
        let threshold: number = RoomPlaneParser.TILE_HOLE;
        if(!useHoles)
        {
            threshold = RoomPlaneParser.TILE_BLOCKED;
        }
        while(step < 1000)
        {
            if(this.getTileHeightInternal((corner.x - step), corner.y) > threshold)
            {
                return new Point((corner.x - (step - 1)), corner.y);
            }
            if(this.getTileHeightInternal((corner.x - step), (corner.y - 1)) <= threshold)
            {
                return new Point((corner.x - step), (corner.y - 1));
            }
            step++;
        }
        return null;
    }

    private extractLeftWall(corner: Point, useHoles: boolean): Point
    {
        if(corner == null)
        {
            return null;
        }
        let step = 1;
        let threshold: number = RoomPlaneParser.TILE_HOLE;
        if(!useHoles)
        {
            threshold = RoomPlaneParser.TILE_BLOCKED;
        }
        while(step < 1000)
        {
            if(this.getTileHeightInternal(corner.x, (corner.y - step)) > threshold)
            {
                return new Point(corner.x, (corner.y - (step - 1)));
            }
            if(this.getTileHeightInternal((corner.x + 1), (corner.y - step)) <= threshold)
            {
                return new Point((corner.x + 1), (corner.y - step));
            }
            step++;
        }
        return null;
    }

    private addWall(location: IVector3D, lengthVector: IVector3D, heightVector: IVector3D, cornerNormal: IVector3D, extendStart: boolean, extendEnd: boolean, addCorner: boolean): void
    {
        this.addPlane(RoomPlaneData.PLANE_WALL, location, lengthVector, heightVector, [ cornerNormal ]);
        this.addPlane(RoomPlaneData.PLANE_LANDSCAPE, location, lengthVector, heightVector, [ cornerNormal ]);
        const wallThickness: number = (RoomPlaneParser.WALL_THICKNESS * this._wallThicknessMultiplier);
        const floorThickness: number = (RoomPlaneParser.FLOOR_THICKNESS * this._floorThicknessMultiplier);
        const normal: Vector3d = Vector3d.crossProduct(lengthVector, heightVector);
        const thicknessVector: Vector3d = Vector3d.product(normal, ((1 / normal.length) * -(wallThickness)));
        this.addPlane(RoomPlaneData.PLANE_WALL, Vector3d.sum(location, heightVector), lengthVector, thicknessVector, [ normal, cornerNormal ]);
        if(extendStart)
        {
            this.addPlane(RoomPlaneData.PLANE_WALL, Vector3d.sum(Vector3d.sum(location, lengthVector), heightVector), Vector3d.product(heightVector, (-(heightVector.length + floorThickness) / heightVector.length)), thicknessVector, [ normal, cornerNormal ]);
        }
        if(extendEnd)
        {
            this.addPlane(RoomPlaneData.PLANE_WALL, Vector3d.sum(location, Vector3d.product(heightVector, (-(floorThickness) / heightVector.length))), Vector3d.product(heightVector, ((heightVector.length + floorThickness) / heightVector.length)), thicknessVector, [ normal, cornerNormal ]);
            if(addCorner)
            {
                const sideVector = Vector3d.product(lengthVector, (wallThickness / lengthVector.length));
                this.addPlane(RoomPlaneData.PLANE_WALL, Vector3d.sum(Vector3d.sum(location, heightVector), Vector3d.product(sideVector, -1)), sideVector, thicknessVector, [ normal, lengthVector, cornerNormal ]);
            }
        }
    }

    private addFloor(location: IVector3D, leftSide: IVector3D, rightSide: IVector3D, hasRightEdge: boolean, hasLeftEdge: boolean, hasBottom: boolean, hasFarCorner: boolean, highlight: boolean = false): void
    {
        let floorThickness: number;
        let thicknessVector: Vector3d;
        let bottomLocation: Vector3d;
        const plane: RoomPlaneData = this.addPlane(RoomPlaneData.PLANE_FLOOR, location, leftSide, rightSide, null, highlight);
        if(plane != null)
        {
            floorThickness = (RoomPlaneParser.FLOOR_THICKNESS * this._floorThicknessMultiplier);
            thicknessVector = new Vector3d(0, 0, floorThickness);
            bottomLocation = Vector3d.dif(location, thicknessVector);
            if(hasBottom)
            {
                this.addPlane(RoomPlaneData.PLANE_FLOOR, bottomLocation, leftSide, thicknessVector, null, highlight);
            }
            if(hasFarCorner)
            {
                this.addPlane(RoomPlaneData.PLANE_FLOOR, Vector3d.sum(bottomLocation, Vector3d.sum(leftSide, rightSide)), Vector3d.product(leftSide, -1), thicknessVector, null, highlight);
            }
            if(hasRightEdge)
            {
                this.addPlane(RoomPlaneData.PLANE_FLOOR, Vector3d.sum(bottomLocation, rightSide), Vector3d.product(rightSide, -1), thicknessVector, null, highlight);
            }
            if(hasLeftEdge)
            {
                this.addPlane(RoomPlaneData.PLANE_FLOOR, Vector3d.sum(bottomLocation, leftSide), rightSide, thicknessVector, null, highlight);
            }
        }
    }

    private addPlane(type: number, location: IVector3D, leftSide: IVector3D, rightSide: IVector3D, secondaryNormals: IVector3D[] = null, highlight: boolean = false): RoomPlaneData
    {
        if(((leftSide.length == 0) || (rightSide.length == 0)))
        {
            return null;
        }
        const plane: RoomPlaneData = new RoomPlaneData(type, location, leftSide, rightSide, secondaryNormals);
        this._planes.push(plane);

        if(highlight) this._highlights.push(plane);

        return plane;
    }

    private initializeHoleMap(): void
    {
        let x: number;
        let y: number;
        let row: boolean[];
        let floorHole: RoomFloorHole;
        let startX: number;
        let endX: number;
        let startY: number;
        let endY: number;
        y = 0;
        while(y < this._height)
        {
            row = this._floorHoleMatrix[y];
            x = 0;
            while(x < this._width)
            {
                row[x] = this._floorHolesInverted.size > 0;
                x++;
            }
            y++;
        }
        for(const hole of this._floorHolesInverted.values())
        {
            this.initializeHole(hole, true);
        }
        for(const hole of this._floorHoles.values())
        {
            this.initializeHole(hole);
        }
    }

    private initializeHole(hole: RoomFloorHole, inverted: boolean = false): void
    {
        let x: number;
        let y: number;
        let row: boolean[];
        let startX: number;
        let endX: number;
        let startY: number;
        let endY: number;
        const floorHole: RoomFloorHole = hole;
        if(floorHole != null)
        {
            startX = floorHole.x;
            endX = ((floorHole.x + floorHole.width) - 1);
            startY = floorHole.y;
            endY = ((floorHole.y + floorHole.height) - 1);
            startX = ((startX < 0) ? 0 : startX);
            endX = ((endX >= this._width) ? (this._width - 1) : endX);
            startY = ((startY < 0) ? 0 : startY);
            endY = ((endY >= this._height) ? (this._height - 1) : endY);
            y = startY;
            while(y <= endY)
            {
                row = this._floorHoleMatrix[y];
                x = startX;
                while(x <= endX)
                {
                    row[x] = !inverted;
                    x++;
                }
                y++;
            }
        }
    }

    private extractPlanes(tiles: number[][], startX: number = 0, startY: number = 0, maxWidth: number = -1, maxHeight: number = -1, highlight: boolean = false): void
    {
        let i = 0;
        let row = 0;
        let col = 0;
        let value = 0;
        let right = 0;
        let bottom = 0;
        let leftEdge = false;
        let topEdge = false;
        let rightEdge = false;
        let bottomEdge = false;
        let scanCol = 0;
        let fillRow = 0;
        let stop = false;
        let planeX = NaN;
        let planeY = NaN;
        let planeWidth = NaN;
        let planeHeight = NaN;
        const rows: number = tiles.length;
        const columns: number = tiles[0].length;
        const rowLimit: number = maxHeight == -1 ? rows : Math.min(rows, startY + maxHeight);
        const columnLimit: number = maxWidth == -1 ? columns : Math.min(columns, startX + maxWidth);
        const visited: boolean[][] = [];
        i = 0;
        while(i < rowLimit)
        {
            visited[i] = [];
            i++;
        }
        row = startY;
        while(row < rowLimit)
        {
            col = startX;
            while(col < columnLimit)
            {
                if(!((value = tiles[row][col]) < 0 || visited[row][col]))
                {
                    leftEdge = col == 0 || tiles[row][col - 1] != value;
                    topEdge = row == 0 || tiles[row - 1][col] != value;
                    right = col + 1;
                    while(right < columnLimit)
                    {
                        if(tiles[row][right] != value || visited[row][right] || row > 0 && tiles[row - 1][right] == value == topEdge)
                        {
                            break;
                        }
                        right++;
                    }
                    rightEdge = right == columns || tiles[row][right] != value;
                    stop = false;
                    bottom = row + 1;
                    while(bottom <= rowLimit && !stop)
                    {
                        bottomEdge = bottom == rows || tiles[bottom][col] != value;
                        stop = bottom == rowLimit || bottomEdge || col > 0 && tiles[bottom][col - 1] == value == leftEdge || right < columns && tiles[bottom][right] == value == rightEdge;
                        if(bottom == rows)
                        {
                            break;
                        }
                        scanCol = col;
                        while(scanCol < right)
                        {
                            if(tiles[bottom][scanCol] == value == bottomEdge)
                            {
                                stop = true;
                                right = scanCol;
                                break;
                            }
                            scanCol++;
                        }
                        if(stop)
                        {
                            break;
                        }
                        bottom++;
                    }
                    if(!bottomEdge)
                    {
                        bottomEdge = bottom == rows;
                    }
                    rightEdge = right == columns || tiles[row][right] != value;
                    fillRow = row;
                    while(fillRow < bottom)
                    {
                        scanCol = col;
                        while(scanCol < right)
                        {
                            visited[fillRow][scanCol] = true;
                            scanCol++;
                        }
                        fillRow++;
                    }
                    planeX = col / 4 - 0.5;
                    planeY = row / 4 - 0.5;
                    planeWidth = (right - col) / 4;
                    planeHeight = (bottom - row) / 4;
                    this.addFloor(new Vector3d(planeX + planeWidth, planeY + planeHeight, value / 4), new Vector3d(-planeWidth, 0, 0), new Vector3d(0, -planeHeight, 0), rightEdge, leftEdge, bottomEdge, topEdge, highlight);
                }
                col++;
            }
            row++;
        }
    }
}
