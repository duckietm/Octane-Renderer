import { IGraphicAssetCollection, IObjectVisualizationData, IRoomGeometry, IRoomObjectController, IRoomObjectSprite, IRoomObjectSpriteVisualization, RoomObjectSpriteData } from '@octane/api';
import { TextureUtils } from '@octane/utils';
import { Container, Rectangle, Sprite, Texture } from 'pixi.js';
import { RoomPlaneDisplay } from '../../renderer/utils/RoomPlaneDisplay';
import { RoomObjectSprite } from './RoomObjectSprite';

export class RoomObjectSpriteVisualization implements IRoomObjectSpriteVisualization
{
    private static VISUALIZATION_COUNTER: number = 0;

    private _id: number = RoomObjectSpriteVisualization.VISUALIZATION_COUNTER++;
    private _object: IRoomObjectController = null;
    private _asset: IGraphicAssetCollection = null;
    private _sprites: IRoomObjectSprite[] = [];

    protected _scale: number = -1;

    private _updateObjectCounter: number = -1;
    private _updateModelCounter: number = -1;
    private _updateSpriteCounter: number = -1;

    public initialize(data: IObjectVisualizationData): boolean
    {
        return false;
    }

    public update(geometry: IRoomGeometry, time: number, update: boolean, skipUpdate: boolean): void
    {
        return;
    }

    protected reset(): void
    {
        this._scale = -1;
    }

    public dispose(): void
    {
        if(this._sprites)
        {
            while(this._sprites.length)
            {
                const sprite = (this._sprites[0] as RoomObjectSprite);

                if(sprite) sprite.dispose();

                this._sprites.shift();
            }

            this._sprites = null;
        }

        this._object = null;
        this._asset = null;
    }

    public getSprite(index: number): IRoomObjectSprite
    {
        if((index >= 0) && (index < this._sprites.length)) return this._sprites[index];

        return null;
    }

    public getSpriteList(): RoomObjectSpriteData[]
    {
        return null;
    }

    public createSprite(): IRoomObjectSprite
    {
        return this.createSpriteAtIndex(this._sprites.length);
    }

    public createSpriteAtIndex(index: number): IRoomObjectSprite
    {
        const sprite = new RoomObjectSprite();

        if(index >= this._sprites.length)
        {
            this._sprites.push(sprite);
        }
        else
        {
            this._sprites.splice(index, 0, sprite);
        }

        return sprite;
    }

    protected createSprites(count: number): void
    {
        while(this._sprites.length > count)
        {
            const sprite = this._sprites[(this._sprites.length - 1)] as RoomObjectSprite;

            if(sprite) sprite.dispose();

            this._sprites.pop();
        }

        while(this._sprites.length < count)
        {
            this._sprites.push(new RoomObjectSprite());
        }
    }

    public get image(): Texture
    {
        return this.getImage();
    }

    public getImage(): Texture
    {
        const boundingRectangle = this.getBoundingRectangle();

        if((boundingRectangle.width * boundingRectangle.height) === 0) return null;

        const spriteCount = this.totalSprites;
        const spriteList: IRoomObjectSprite[] = [];

        let index = 0;

        while(index < spriteCount)
        {
            const objectSprite = this.getSprite(index);

            if(objectSprite && objectSprite.visible && objectSprite.texture) spriteList.push(objectSprite);

            index++;
        }

        spriteList.sort((a, b) =>
        {
            return b.relativeDepth - a.relativeDepth;
        });

        const container = new Container();

        index = 0;

        while(index < spriteList.length)
        {
            const objectSprite = spriteList[index];
            const texture = objectSprite.texture;

            if(objectSprite.planeDrawData)
            {
                // A room plane drawn from its tile: same display the canvas uses, under a tinted holder.
                const holder = new Container();
                const display = new RoomPlaneDisplay();

                display.setData(objectSprite.planeDrawData);

                holder.addChild(display);
                holder.alpha = (objectSprite.alpha / 255);
                holder.tint = objectSprite.color;
                holder.x = objectSprite.offsetX;
                holder.y = objectSprite.offsetY;
                holder.blendMode = objectSprite.blendMode;
                holder.filters = objectSprite.filters;

                container.addChild(holder);
            }
            else if(texture)
            {
                const sprite = new Sprite(texture);

                sprite.alpha = (objectSprite.alpha / 255);
                sprite.tint = objectSprite.color;
                sprite.x = objectSprite.offsetX;
                sprite.y = objectSprite.offsetY;
                sprite.blendMode = objectSprite.blendMode;
                sprite.filters = objectSprite.filters;

                if(objectSprite.flipH) sprite.scale.x = -1;

                if(objectSprite.flipV) sprite.scale.y = -1;

                container.addChild(sprite);
            }

            index++;
        }

        const renderTexture = TextureUtils.generateTexture({
            target: container,
            resolution: 1
        });

        container.destroy({ children: true });

        return renderTexture;
    }

    /**
     * The union of the visible, textured sprites. It used to start from sprite 0 only, so a hidden or empty first
     * layer left the origin in the union, and moving the left or top edge kept the width and lost the right edge.
     */
    public getBoundingRectangle(): Rectangle
    {
        const totalSprites = this.totalSprites;

        let left = Infinity;
        let top = Infinity;
        let right = -Infinity;
        let bottom = -Infinity;

        for(let iterator = 0; iterator < totalSprites; iterator++)
        {
            const sprite = this.getSprite(iterator);

            if(!sprite || !sprite.texture || !sprite.visible) continue;

            const offsetX = ((sprite.flipH) ? (-(sprite.width) + sprite.offsetX) : sprite.offsetX);
            const offsetY = ((sprite.flipV) ? (-(sprite.height) + sprite.offsetY) : sprite.offsetY);

            left = Math.min(left, offsetX);
            top = Math.min(top, offsetY);
            right = Math.max(right, offsetX + sprite.width);
            bottom = Math.max(bottom, offsetY + sprite.height);
        }

        if(left === Infinity) return new Rectangle();

        return new Rectangle(left, top, (right - left), (bottom - top));
    }

    public get instanceId(): number
    {
        return this._id;
    }

    public get object(): IRoomObjectController
    {
        return this._object;
    }

    public set object(object: IRoomObjectController)
    {
        this._object = object;
    }

    public get asset(): IGraphicAssetCollection
    {
        return this._asset;
    }

    public set asset(asset: IGraphicAssetCollection)
    {
        if(this._asset) this._asset.removeReference();

        this._asset = asset;

        if(this._asset) this._asset.addReference();
    }

    public get sprites(): IRoomObjectSprite[]
    {
        return this._sprites;
    }

    public get totalSprites(): number
    {
        return this._sprites.length;
    }

    public get updateObjectCounter(): number
    {
        return this._updateObjectCounter;
    }

    public set updateObjectCounter(count: number)
    {
        this._updateObjectCounter = count;
    }

    public get updateModelCounter(): number
    {
        return this._updateModelCounter;
    }

    public set updateModelCounter(count: number)
    {
        this._updateModelCounter = count;
    }

    public get updateSpriteCounter(): number
    {
        return this._updateSpriteCounter;
    }

    public set updateSpriteCounter(count: number)
    {
        this._updateSpriteCounter = count;
    }

    public get spriteCount(): number
    {
        return this._sprites.length;
    }
}
