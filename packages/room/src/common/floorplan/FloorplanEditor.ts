import { ActionSettings } from './ActionSettings';
import { FloorAction, HEIGHT_SCHEME, MAX_NUM_TILE_PER_AXIS, TILE_SIZE } from './Constants';
import { imageBase64, spritesheet } from './FloorplanResource';
import { Tile } from './Tile';
import { getScreenPositionForTile } from './Utils';

export class FloorplanEditor
{
    private static _INSTANCE: FloorplanEditor = null;

    public static readonly TILE_BLOCKED = 'r_blocked';
    public static readonly TILE_DOOR = 'r_door';

    private _tilemap: Tile[][];
    private _width: number;
    private _height: number;
    private _isPointerDown: boolean;
    private _doorLocation: { x: number, y: number };
    private _lastUsedTile: { x: number, y: number };
    private _isSquareSelectMode: boolean;
    private _squareSelectStart: { x: number, y: number };
    private _squareSelectEnd: { x: number, y: number };
    private _renderer: CanvasRenderingContext2D;
    private _actionSettings: ActionSettings;

    private _image: HTMLImageElement;

    public onTilemapChange: (() => void) | null = null;

    constructor()
    {
        const width = TILE_SIZE * MAX_NUM_TILE_PER_AXIS + 20;
        const height = (TILE_SIZE * MAX_NUM_TILE_PER_AXIS) / 2 + 100;

        const canvas = document.createElement('canvas');

        canvas.height = height;
        canvas.width = width;

        canvas.style.touchAction = 'none';

        this._renderer = canvas.getContext('2d');

        this._image = new Image();

        this._image.src = imageBase64;

        this._tilemap = [];
        this._doorLocation = { x: 0, y: 0 };
        this._width = 0;
        this._height = 0;
        this._isPointerDown = false;
        this._lastUsedTile = { x: -1, y: -1 };
        this._isSquareSelectMode = false;
        this._squareSelectStart = null;
        this._squareSelectEnd = null;
        this._actionSettings = new ActionSettings();
    }

    public onPointerRelease(event: PointerEvent = null): void
    {
        if(this._isSquareSelectMode && this._isPointerDown && this._squareSelectStart)
        {
            if(event)
            {
                const tile = this.getTileAtPosition({ x: event.offsetX, y: event.offsetY });

                if(tile) this._squareSelectEnd = tile;
            }

            if(this._squareSelectEnd) this.fillSquareSelection();
        }

        this._isPointerDown = false;
        this._squareSelectStart = null;
        this._squareSelectEnd = null;
    }

    public onPointerDown(event: PointerEvent): void
    {
        if(event.button === 2) return;

        const location = { x: event.offsetX, y: event.offsetY };

        this._isPointerDown = true;

        if(this._isSquareSelectMode)
        {
            const tile = this.getTileAtPosition(location);

            this._squareSelectStart = tile;
            this._squareSelectEnd = tile;

            this.renderTiles();

            return;
        }

        this.tileHitDetection(location, true);
    }

    public onPointerMove(event: PointerEvent): void
    {
        if(!this._isPointerDown) return;

        const location = { x: event.offsetX, y: event.offsetY };

        if(this._isSquareSelectMode)
        {
            const tile = this.getTileAtPosition(location);

            if(tile)
            {
                this._squareSelectEnd = tile;
                this.renderTiles();
            }

            return;
        }

        this.tileHitDetection(location, false);
    }

    private getTileAtPosition(tempPoint: { x: number, y: number }): { x: number, y: number }
    {
        const mousePositionX = Math.floor(tempPoint.x);
        const mousePositionY = Math.floor(tempPoint.y);

        const width = TILE_SIZE;
        const height = TILE_SIZE / 2;

        for(let y = 0; y < this._tilemap.length; y++)
        {
            for(let x = 0; x < this.tilemap[y].length; x++)
            {
                const [ tileStartX, tileStartY ] = getScreenPositionForTile(x, y);

                const centreX = tileStartX + (width / 2);
                const centreY = tileStartY + (height / 2);

                const dx = Math.abs(mousePositionX - centreX);
                const dy = Math.abs(mousePositionY - centreY);

                const solution = (dx / (width * 0.5) + dy / (height * 0.5) <= 1);

                if(solution) return { x, y };
            }
        }

        return null;
    }

    private fillSquareSelection(): void
    {
        const startX = Math.min(this._squareSelectStart.x, this._squareSelectEnd.x);
        const endX = Math.max(this._squareSelectStart.x, this._squareSelectEnd.x);
        const startY = Math.min(this._squareSelectStart.y, this._squareSelectEnd.y);
        const endY = Math.max(this._squareSelectStart.y, this._squareSelectEnd.y);

        for(let y = startY; y <= endY; y++)
        {
            for(let x = startX; x <= endX; x++)
            {
                this.onClick(x, y, false);
            }
        }

        this.renderTiles();
    }

    private tileHitDetection(tempPoint: { x: number, y: number }, isClick: boolean = false): boolean
    {
        const mousePositionX = Math.floor(tempPoint.x);
        const mousePositionY = Math.floor(tempPoint.y);

        const width = TILE_SIZE;
        const height = TILE_SIZE / 2;

        for(let y = 0; y < this._tilemap.length; y++)
        {
            for(let x = 0; x < this.tilemap[y].length; x++)
            {
                const [ tileStartX, tileStartY ] = getScreenPositionForTile(x, y);

                const centreX = tileStartX + (width / 2);
                const centreY = tileStartY + (height / 2);

                const dx = Math.abs(mousePositionX - centreX);
                const dy = Math.abs(mousePositionY - centreY);

                const solution = (dx / (width * 0.5) + dy / (height * 0.5) <= 1);//todo: improve this

                if(solution)
                {
                    if(this._isPointerDown)
                    {
                        if(isClick)
                        {
                            this.onClick(x, y);
                        }

                        else if(this._lastUsedTile.x !== x || this._lastUsedTile.y !== y)
                        {
                            this._lastUsedTile.x = x;
                            this._lastUsedTile.y = y;
                            this.onClick(x, y);
                        }

                    }
                    return true;
                }
            }
        }
        return false;
    }

    private onClick(x: number, y: number, render: boolean = true): void
    {
        const tile = (this._tilemap[y] && this._tilemap[y][x]);

        if(!tile) return;

        const heightIndex = HEIGHT_SCHEME.indexOf(tile.height);

        let futureHeightIndex = 0;

        switch(this._actionSettings.currentAction)
        {
            case FloorAction.DOOR:

                if(tile.height !== 'x')
                {
                    this._doorLocation.x = x;
                    this._doorLocation.y = y;
                    if(render) this.renderTiles();
                }
                return;
            case FloorAction.UP:
                if(tile.height === 'x') return;
                futureHeightIndex = heightIndex + 1;
                break;
            case FloorAction.DOWN:
                if(tile.height === 'x' || (heightIndex <= 1)) return;
                futureHeightIndex = heightIndex - 1;
                break;
            case FloorAction.SET:
                futureHeightIndex = HEIGHT_SCHEME.indexOf(this._actionSettings.currentHeight);
                break;
            case FloorAction.UNSET:
                futureHeightIndex = 0;
                break;
        }

        if(futureHeightIndex === -1) return;

        if(heightIndex === futureHeightIndex) return;

        if(futureHeightIndex > 0)
        {
            if((x + 1) > this._width) this._width = x + 1;

            if((y + 1) > this._height) this._height = y + 1;
        }

        const newHeight = HEIGHT_SCHEME[futureHeightIndex];

        if(!newHeight) return;

        if(tile.isBlocked) return;

        this._tilemap[y][x].height = newHeight;

        if(render) this.renderTiles();
    }

    public renderTiles(): void
    {
        this.clearCanvas();

        for(let y = 0; y < this._tilemap.length; y++)
        {
            for(let x = 0; x < this.tilemap[y].length; x++)
            {
                const tile = this.tilemap[y][x];
                let assetName = tile.height;

                if(this._doorLocation.x === x && this._doorLocation.y === y)
                    assetName = FloorplanEditor.TILE_DOOR;

                if(tile.isBlocked) assetName = FloorplanEditor.TILE_BLOCKED;

                //if((tile.height === 'x') || tile.height === 'X') continue;
                const [ positionX, positionY ] = getScreenPositionForTile(x, y);

                const asset = spritesheet.frames[assetName];

                this.renderer.drawImage(this._image, asset.frame.x, asset.frame.y, asset.frame.w, asset.frame.h, positionX, positionY, asset.frame.w, asset.frame.h);
            }
        }

        this.renderSquareSelectionPreview();

        if(this.onTilemapChange) this.onTilemapChange();
    }

    private renderSquareSelectionPreview(): void
    {
        if(!this._isSquareSelectMode || !this._isPointerDown || !this._squareSelectStart || !this._squareSelectEnd) return;

        const startX = Math.min(this._squareSelectStart.x, this._squareSelectEnd.x);
        const endX = Math.max(this._squareSelectStart.x, this._squareSelectEnd.x);
        const startY = Math.min(this._squareSelectStart.y, this._squareSelectEnd.y);
        const endY = Math.max(this._squareSelectStart.y, this._squareSelectEnd.y);

        const width = TILE_SIZE;
        const height = TILE_SIZE / 2;

        this.renderer.save();

        for(let y = startY; y <= endY; y++)
        {
            for(let x = startX; x <= endX; x++)
            {
                const tile = (this._tilemap[y] && this._tilemap[y][x]);

                if(!tile || tile.isBlocked) continue;

                const [ tileStartX, tileStartY ] = getScreenPositionForTile(x, y);
                const centreX = tileStartX + (width / 2);
                const centreY = tileStartY + (height / 2);

                this.renderer.beginPath();
                this.renderer.moveTo(centreX, tileStartY);
                this.renderer.lineTo(tileStartX + width, centreY);
                this.renderer.lineTo(centreX, tileStartY + height);
                this.renderer.lineTo(tileStartX, centreY);
                this.renderer.closePath();
                this.renderer.fillStyle = 'rgba(255, 255, 255, 0.25)';
                this.renderer.fill();
                this.renderer.strokeStyle = 'rgba(255, 255, 255, 0.7)';
                this.renderer.lineWidth = 1;
                this.renderer.stroke();
            }
        }

        this.renderer.restore();
    }

    public setTilemap(map: string, blockedTiles: boolean[][]): void
    {
        this._tilemap = [];
        const roomMapStringSplit = map.split('\r');

        let width = 0;
        let height = roomMapStringSplit.length;

        // find the map width, height
        for(let y = 0; y < height; y++)
        {
            const originalRow = roomMapStringSplit[y];

            if(originalRow.length === 0)
            {
                roomMapStringSplit.splice(y, 1);
                height = roomMapStringSplit.length;
                y--;
                continue;
            }

            if(originalRow.length > width)
            {
                width = originalRow.length;
            }
        }
        // fill map with room heightmap tiles
        for(let y = 0; y < height; y++)
        {
            this._tilemap[y] = [];
            const rowString = roomMapStringSplit[y];

            for(let x = 0; x < width; x++)
            {
                const blocked = (blockedTiles[y] && blockedTiles[y][x]) || false;

                const char = rowString[x];
                if(((!(char === 'x')) && (!(char === 'X')) && char))
                {
                    this._tilemap[y][x] = new Tile(char, blocked);
                }
                else
                {
                    this._tilemap[y][x] = new Tile('x', blocked);
                }
            }

            for(let x = width; x < MAX_NUM_TILE_PER_AXIS; x++)
            {
                this.tilemap[y][x] = new Tile('x', false);
            }
        }

        // fill remaining map with empty tiles
        for(let y = height; y < MAX_NUM_TILE_PER_AXIS; y++)
        {
            if(!this.tilemap[y]) this.tilemap[y] = [];
            for(let x = 0; x < MAX_NUM_TILE_PER_AXIS; x++)
            {
                this.tilemap[y][x] = new Tile('x', false);
            }
        }

        this._width = width;
        this._height = height;
    }

    public getCurrentTilemapString(): string
    {
        // always rescan bounds: bulk operations like toggleSelectAll / fillSquareSelection
        // mutate tile.height directly without updating _width/_height
        this._width = 0;
        this._height = 0;

        for(let y = MAX_NUM_TILE_PER_AXIS - 1; y >= 0; y--)
        {
            if(!this._tilemap[y]) continue;

            for(let x = MAX_NUM_TILE_PER_AXIS - 1; x >= 0; x--)
            {
                if(!this._tilemap[y][x]) continue;

                if(this._tilemap[y][x].height !== 'x')
                {
                    if((x + 1) > this._width) this._width = x + 1;
                    if((y + 1) > this._height) this._height = y + 1;
                }
            }
        }

        const rows = [];

        for(let y = 0; y < this._height; y++)
        {
            const row = [];

            for(let x = 0; x < this._width; x++)
            {
                const tile = this._tilemap[y][x];

                row[x] = tile.height;
            }

            rows[y] = row.join('');
        }

        return rows.join('\r');
    }

    public clear(): void
    {
        this._tilemap = [];
        this._doorLocation = { x: -1, y: -1 };
        this._width = 0;
        this._height = 0;
        this._isPointerDown = false;
        this._lastUsedTile = { x: -1, y: -1 };
        this._actionSettings.clear();
        this._isSquareSelectMode = false;
        this._squareSelectStart = null;
        this._squareSelectEnd = null;
        this.clearCanvas();
        this.onTilemapChange = null;
    }


    public toggleSelectAll(): void
    {
        const shouldUnset = (this._actionSettings.currentAction === FloorAction.UNSET);

        for(let y = 0; y < this._tilemap.length; y++)
        {
            for(let x = 0; x < this.tilemap[y].length; x++)
            {
                const tile = this._tilemap[y][x];

                if(!tile || tile.isBlocked) continue;

                tile.height = shouldUnset ? 'x' : this._actionSettings.currentHeight;
            }
        }

        this.renderTiles();
    }

    public toggleSquareSelectMode(): boolean
    {
        this._isSquareSelectMode = !this._isSquareSelectMode;

        this._squareSelectStart = null;
        this._squareSelectEnd = null;

        return this._isSquareSelectMode;
    }

    public get isSquareSelectMode(): boolean
    {
        return this._isSquareSelectMode;
    }

    public clearCanvas(): void
    {
        this.renderer.fillStyle = '0x000000';
        this.renderer.fillRect(0, 0, this._renderer.canvas.width, this._renderer.canvas.height);
    }

    public get renderer(): CanvasRenderingContext2D
    {
        return this._renderer;
    }

    public get tilemap(): Tile[][]
    {
        return this._tilemap;
    }

    public get doorLocation(): { x: number, y: number }
    {
        return this._doorLocation;
    }

    public set doorLocation(value: { x: number, y: number })
    {
        this._doorLocation = value;
    }

    public get actionSettings(): ActionSettings
    {
        return this._actionSettings;
    }

    public static get instance(): FloorplanEditor
    {
        if(!FloorplanEditor._INSTANCE)
        {
            FloorplanEditor._INSTANCE = new FloorplanEditor();
        }

        return FloorplanEditor._INSTANCE;
    }
}
