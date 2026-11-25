import { Container, Matrix, Point, Rectangle, Sprite, Texture } from 'pixi.js';

// The layer model is ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).

// One asset of a baked body part, placed in the part's own coordinates. `quad` is filled in by the
// atlas the first time it draws the layer (its corners and vertex colour never change).
export type AvatarPartLayer = { texture: Texture; flipped: boolean; x: number; y: number; tint: number; quad?: AvatarLayerQuad };
export type AvatarLayerQuad = { left: number; right: number; top: number; bottom: number; color: number; unpremultiplied: boolean };

export class AvatarImageBodyPartContainer
{
    private static MATRIX: Matrix = new Matrix();
    private static NEXT_UID: number = 1;

    private _uid: number = AvatarImageBodyPartContainer.NEXT_UID++;
    private _layers: AvatarPartLayer[];
    private _width: number;
    private _height: number;
    private _image: Container = null;
    private _regPoint: Point;
    private _offset: Point;
    private _isCacheable: boolean;
    private _bounds: Rectangle;

    // A part is kept as its layer list. The atlas draws the layers with pooled sprites, so most
    // parts never need Pixi objects of their own; `image` builds the container on first use.
    constructor(layers: AvatarPartLayer[], width: number, height: number, regPoint: Point, isCacheable: boolean, bounds: Rectangle)
    {
        this._layers = layers;
        this._width = width;
        this._height = height;
        this._regPoint = regPoint;
        this._offset = new Point(0, 0);
        this._isCacheable = isCacheable;
        this._bounds = bounds;
    }

    public dispose(): void
    {
        if(this._image && !this._image.destroyed)
        {
            this._image.destroy({
                children: true
            });
        }

        this._image = null;
        this._layers = null;
        this._regPoint = null;
        this._offset = null;
    }

    public setRegPoint(regPoint: Point): void
    {
        this._regPoint = regPoint;
    }

    public get uid(): number
    {
        return this._uid;
    }

    public get layers(): AvatarPartLayer[]
    {
        return this._layers;
    }

    public get image(): Container
    {
        // A caller that destroyed the tree it was handed (processAsContainer) gets a new one next time.
        if(this._image && this._image.destroyed) this._image = null;

        if(!this._image && this._layers) this._image = this.buildImage();

        return this._image;
    }

    private buildImage(): Container
    {
        const container = new Container();
        const sizing = new Sprite(Texture.EMPTY);

        sizing.width = this._width;
        sizing.height = this._height;

        container.addChild(sizing);

        const matrix = AvatarImageBodyPartContainer.MATRIX;

        for(const layer of this._layers)
        {
            matrix.set((layer.flipped ? -1 : 1), 0, 0, 1, layer.x, layer.y);

            const sprite = new Sprite(layer.texture);

            sprite.tint = layer.tint;
            sprite.setFromMatrix(matrix);

            container.addChild(sprite);
        }

        return container;
    }

    public get regPoint(): Point
    {
        const clone = this._regPoint.clone();

        clone.x += this._offset.x;
        clone.y += this._offset.y;

        return clone;
    }

    public get regX(): number
    {
        return (this._regPoint.x + this._offset.x);
    }

    public get regY(): number
    {
        return (this._regPoint.y + this._offset.y);
    }

    public get bounds(): Rectangle
    {
        return this._bounds;
    }

    public set offset(offset: Point)
    {
        this._offset = offset;
    }

    public setOffset(x: number, y: number): void
    {
        if(!this._offset) this._offset = new Point(x, y);
        else this._offset.set(x, y);
    }

    public get isCacheable(): boolean
    {
        return this._isCacheable;
    }
}
