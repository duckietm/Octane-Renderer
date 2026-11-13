/** Something the fx painters draw from: an fx asset or another fx bitmap. */
export interface IVariableFxImage
{
    readonly width: number;
    readonly height: number;
    readonly source: CanvasImageSource;
}

/** A colour transform's multipliers (AIR's ColorTransform without offsets, which the painters never use). */
export interface IVariableFxColorTransform
{
    readonly red: number;
    readonly green: number;
    readonly blue: number;
    readonly alpha: number;
}

export interface IVariableFxRect
{
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

/** The blend modes the painters use. */
export enum VariableFxBlendMode
{
    NORMAL = 'normal',
    ADD = 'add',
    MULTIPLY = 'multiply'
}

export type VariableFxCanvas = HTMLCanvasElement | OffscreenCanvas;
export type VariableFxCanvasContext = CanvasRenderingContext2D | OffscreenCanvasRenderingContext2D;

const createBrowserCanvas = (width: number, height: number): VariableFxCanvas =>
{
    if(typeof document !== 'undefined')
    {
        const canvas = document.createElement('canvas');

        canvas.width = width;
        canvas.height = height;

        return canvas;
    }

    if(typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);

    return null;
};

const compositeOperation = (blend: VariableFxBlendMode): GlobalCompositeOperation =>
{
    switch(blend)
    {
        case VariableFxBlendMode.ADD: return 'lighter';
        case VariableFxBlendMode.MULTIPLY: return 'multiply';
        default: return 'source-over';
    }
};

const hasColorMultipliers = (transform: IVariableFxColorTransform): boolean =>
    !!transform && ((transform.red !== 1) || (transform.green !== 1) || (transform.blue !== 1));

const channel = (multiplier: number): number => Math.max(0, Math.min(255, Math.round(multiplier * 255)));

/**
 * AIR's BitmapData as its HTML client draws it: a 2D canvas, drawn into with the blend mode as the
 * canvas composite operation ("lighter" for add, "multiply"), the clip rect as a canvas clip, no
 * smoothing, and a colour transform baked into a copy of the source (multiplied fill, then the
 * source's alpha put back). `create` is the one place bitmaps come from, so tests can swap it.
 */
export class VariableFxBitmap implements IVariableFxImage
{
    public static createCanvas: (width: number, height: number) => VariableFxCanvas = createBrowserCanvas;
    public static create: (width: number, height: number) => VariableFxBitmap = (width, height) => new VariableFxBitmap(width, height);

    public readonly width: number;
    public readonly height: number;

    private _canvas: VariableFxCanvas = null;
    private _context: VariableFxCanvasContext = null;
    private _disposed: boolean = false;

    constructor(width: number, height: number)
    {
        this.width = Math.max(1, (width | 0));
        this.height = Math.max(1, (height | 0));
        this._canvas = VariableFxBitmap.createCanvas(this.width, this.height);
        this._context = (this._canvas ? this._canvas.getContext('2d') : null);
    }

    public get source(): CanvasImageSource
    {
        return this._canvas;
    }

    public get disposed(): boolean
    {
        return this._disposed;
    }

    /** Sets the rect to one colour, alpha included (AIR's fillRect). */
    public fillRect(x: number, y: number, width: number, height: number, argb: number): void
    {
        const context = this._context;
        const left = Math.max(0, (x | 0));
        const top = Math.max(0, (y | 0));
        const right = Math.min(this.width, Math.ceil(x + width));
        const bottom = Math.min(this.height, Math.ceil(y + height));

        if(!context || (left >= right) || (top >= bottom)) return;

        const alpha = ((argb >>> 24) & 255);

        context.save();
        context.setTransform(1, 0, 0, 1, 0, 0);
        context.globalAlpha = 1;
        context.globalCompositeOperation = 'source-over';
        context.clearRect(left, top, (right - left), (bottom - top));

        if(alpha > 0)
        {
            context.fillStyle = `rgba(${ (argb >>> 16) & 255 }, ${ (argb >>> 8) & 255 }, ${ argb & 255 }, ${ alpha / 255 })`;
            context.fillRect(left, top, (right - left), (bottom - top));
        }

        context.restore();
    }

    /**
     * Draws `image` scaled horizontally by `scaleX` and moved by (`tx`, `ty`), through the colour
     * transform, with the blend mode, inside `clip` (AIR's BitmapData.draw).
     */
    public draw(image: IVariableFxImage, scaleX: number, tx: number, ty: number, transform: IVariableFxColorTransform, blend: VariableFxBlendMode, clip: IVariableFxRect): void
    {
        const context = this._context;

        if(!context || !image || !image.source || (image.width <= 0) || (image.height <= 0)) return;
        if(clip && ((clip.width <= 0) || (clip.height <= 0))) return;

        const tinted = hasColorMultipliers(transform);
        const surface = (tinted ? this.createTintedSurface(image, transform) : image.source);

        if(!surface) return;

        context.save();
        context.imageSmoothingEnabled = false;

        if(clip)
        {
            context.setTransform(1, 0, 0, 1, 0, 0);
            context.beginPath();
            context.rect(clip.x, clip.y, clip.width, clip.height);
            context.clip();
        }

        context.globalAlpha = ((!tinted && transform) ? Math.max(0, Math.min(1, transform.alpha)) : 1);
        context.globalCompositeOperation = compositeOperation(blend);
        context.setTransform(scaleX, 0, 0, 1, tx, ty);
        context.drawImage(surface, 0, 0);
        context.restore();
    }

    /**
     * Draws `image` (placed at `imageX`, `imageY`) with its alpha replaced by the red channel of
     * `mask` (placed at `maskX`, `maskY`), only where both overlap and inside `clip`: AIR's
     * copyChannel / copyPixels masking the heart's end pointer uses.
     */
    public drawAlphaMasked(image: IVariableFxImage, imageX: number, imageY: number, mask: IVariableFxImage, maskX: number, maskY: number, blend: VariableFxBlendMode, opacity: number, clip: IVariableFxRect): void
    {
        if(!this._context || !image || !mask) return;

        const bounds = this.targetBounds(imageX, imageY, image.width, image.height, clip);
        const left = Math.max(bounds.left, (maskX | 0));
        const top = Math.max(bounds.top, (maskY | 0));
        const right = Math.min(bounds.right, ((maskX | 0) + mask.width));
        const bottom = Math.min(bounds.bottom, ((maskY | 0) + mask.height));
        const width = (right - left);
        const height = (bottom - top);

        if((width <= 0) || (height <= 0)) return;

        const pixels = VariableFxBitmap.readPixels(image, ((imageX | 0) - left), ((imageY | 0) - top), width, height);
        const maskPixels = VariableFxBitmap.readPixels(mask, ((maskX | 0) - left), ((maskY | 0) - top), width, height);

        if(!pixels || !maskPixels) return;

        for(let index = 0; index < pixels.length; index += 4) pixels[index + 3] = maskPixels[index];

        const masked = VariableFxBitmap.create(width, height);

        masked.putPixels(pixels);

        const alpha = Math.max(0, Math.min(255, opacity));

        if(alpha > 0) this.draw(masked, 1, left, top, ((alpha >= 255) ? null : { red: 1, green: 1, blue: 1, alpha: (alpha / 255) }), blend, null);

        masked.dispose();
    }

    public targetBounds(x: number, y: number, width: number, height: number, clip: IVariableFxRect = null): { left: number, top: number, right: number, bottom: number }
    {
        const ox = (x | 0);
        const oy = (y | 0);
        let left = Math.max(0, ox);
        let top = Math.max(0, oy);
        let right = Math.min(this.width, (ox + Math.max(0, (width | 0))));
        let bottom = Math.min(this.height, (oy + Math.max(0, (height | 0))));

        if(clip)
        {
            left = Math.max(left, (clip.x | 0));
            top = Math.max(top, (clip.y | 0));
            right = Math.min(right, ((clip.x | 0) + Math.max(0, (clip.width | 0))));
            bottom = Math.min(bottom, ((clip.y | 0) + Math.max(0, (clip.height | 0))));
        }

        return { left, top, right: Math.max(left, right), bottom: Math.max(top, bottom) };
    }

    public dispose(): void
    {
        this._disposed = true;
        this._canvas = null;
        this._context = null;
    }

    protected putPixels(pixels: Uint8ClampedArray): void
    {
        if(!this._context) return;

        const data = this._context.createImageData(this.width, this.height);

        data.data.set(pixels.subarray(0, data.data.length));
        this._context.putImageData(data, 0, 0);
    }

    /** RGBA of `image` in a width x height window, the image drawn at (`x`, `y`) in it. */
    private static readPixels(image: IVariableFxImage, x: number, y: number, width: number, height: number): Uint8ClampedArray
    {
        const canvas = VariableFxBitmap.createCanvas(width, height);
        const context = (canvas ? canvas.getContext('2d') : null);

        if(!context) return null;

        context.imageSmoothingEnabled = false;
        context.clearRect(0, 0, width, height);
        context.drawImage(image.source, x, y);

        return context.getImageData(0, 0, width, height).data;
    }

    private createTintedSurface(image: IVariableFxImage, transform: IVariableFxColorTransform): CanvasImageSource
    {
        const canvas = VariableFxBitmap.createCanvas(image.width, image.height);
        const context = (canvas ? canvas.getContext('2d') : null);

        if(!context) return null;

        context.clearRect(0, 0, image.width, image.height);
        context.drawImage(image.source, 0, 0);
        context.globalCompositeOperation = 'multiply';
        context.fillStyle = `rgb(${ channel(transform.red) }, ${ channel(transform.green) }, ${ channel(transform.blue) })`;
        context.fillRect(0, 0, image.width, image.height);
        context.globalCompositeOperation = 'destination-in';
        context.drawImage(image.source, 0, 0);

        if(transform.alpha !== 1)
        {
            context.fillStyle = `rgba(0, 0, 0, ${ Math.max(0, Math.min(1, transform.alpha)) })`;
            context.fillRect(0, 0, image.width, image.height);
        }

        context.globalCompositeOperation = 'source-over';

        return canvas;
    }
}
