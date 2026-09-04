import { Texture } from 'pixi.js';
import { GetConfiguration } from '@nitrots/configuration';

type HabbiconFrameData = { id: number, x: number, y: number, width: number, height: number };

type HabbiconDefinition = {
    id: number;
    name: string;
    direction: number;
    previewWidth: number;
    previewHeight: number;
    x: number;
    y: number;
    animated: boolean;
    loop: boolean;
    frameData: HabbiconFrameData[];
    steps: { sourceFrame: number, durationMs: number }[];
};

export type HabbiconRuntimeFrame = {
    canvas: HTMLCanvasElement;
    smallCanvas: HTMLCanvasElement;
    width: number;
    height: number;
};

export type HabbiconRuntimeAsset = {
    animated: boolean;
    loop: boolean;
    direction: number;
    baseWidth: number;
    baseHeight: number;
    frames: HabbiconRuntimeFrame[];
    steps: { sourceFrame: number, durationMs: number }[];
    playbackDurationMs: number;
};

export class HabbiconAssetManager
{
    private static _instance: HabbiconAssetManager = null;
    private static FRAME_SIZE: number = 40;
    private static OUTLINE_SIZE: number = 2;
    private static SHADOW_PADDING: number = 5;
    private static CONTENT_INSET: number = 7;
    public static readonly SPINNING_DUCK_NAME: string = 'duck_spinning';

    private _loading: Promise<void> | null = null;
    private _definitions = new Map<number, HabbiconDefinition>();
    private _runtimeAssets = new Map<number, HabbiconRuntimeAsset>();
    private _sourceCanvases = new Map<string, HTMLCanvasElement>();
    private _composedTextures = new Map<string, Texture>();
    private _animationLoading = new Map<number, Promise<void>>();
    private _spritesheet: HTMLImageElement = null;

    public static getInstance(): HabbiconAssetManager
    {
        if(!HabbiconAssetManager._instance) HabbiconAssetManager._instance = new HabbiconAssetManager();

        return HabbiconAssetManager._instance;
    }

    public preload(): Promise<void>
    {
        if(this._loading === null) this._loading = this.load();

        return this._loading;
    }

    public getNameKey(habbiconId: number): string
    {
        void this.preload();

        return this._definitions.get(habbiconId)?.name || '';
    }

    public getDirection(habbiconId: number): number
    {
        void this.preload();

        return this._definitions.get(habbiconId)?.direction || 0;
    }

    public getRuntimeAsset(habbiconId: number): HabbiconRuntimeAsset
    {
        if(habbiconId <= 0) return null;

        void this.preload();

        const existing = this._runtimeAssets.get(habbiconId);

        if(existing?.animated || (existing?.frames?.length && !this._definitions.get(habbiconId)?.animated)) return existing;

        const definition = this._definitions.get(habbiconId);

        if(!definition) return null;

        if(definition.animated && !this._animationLoading.has(habbiconId))
        {
            this._animationLoading.set(habbiconId, this.loadAnimation(habbiconId, definition));
        }

        const fallback = this.buildFallbackRuntimeAsset(definition);

        if(!definition.animated && fallback.frames.length) this._runtimeAssets.set(habbiconId, fallback);

        return fallback;
    }

    public getSourceCanvas(habbiconId: number, frameIndex: number, small: boolean): HTMLCanvasElement
    {
        const runtime = this.getRuntimeAsset(habbiconId);

        if(runtime?.frames?.length)
        {
            const frame = runtime.frames[Math.max(0, Math.min(frameIndex, runtime.frames.length - 1))];

            if(frame) return small ? frame.smallCanvas : frame.canvas;
        }

        return this.getPreviewSourceCanvas(habbiconId, small);
    }

    public getPreviewSourceCanvas(habbiconId: number, small: boolean): HTMLCanvasElement
    {
        if(habbiconId <= 0) return null;

        void this.preload();

        const key = `${ habbiconId }:preview:${ small ? 'small' : 'large' }`;
        const existing = this._sourceCanvases.get(key);

        if(existing) return existing;

        if(!this._spritesheet || !this._spritesheet.complete) return null;

        const definition = this._definitions.get(habbiconId);

        if(!definition) return null;

        const scale = small ? 0.5 : 1;
        const canvas = this.createFrameCanvas(this._spritesheet, definition.x, definition.y, definition.previewWidth, definition.previewHeight, scale);

        if(!canvas) return null;

        this._sourceCanvases.set(key, canvas);

        return canvas;
    }

    public composeTexture(source: HTMLCanvasElement, sourceAlpha: number, backgroundAlpha: number, mirrored: boolean, cacheKey: string): Texture
    {
        if(!source) return null;

        const existing = this._composedTextures.get(cacheKey);

        if(existing) return existing;

        const composed = this.composeBubbleCanvas(source, sourceAlpha, backgroundAlpha, mirrored);

        if(!composed) return null;

        const texture = Texture.from(composed);

        this._composedTextures.set(cacheKey, texture);

        return texture;
    }

    public getPreviewTexture(habbiconId: number, small: boolean): Texture
    {
        const source = this.getPreviewSourceCanvas(habbiconId, small);

        if(!source) return null;

        return this.composeTexture(source, 255, 255, false, `${ habbiconId }:preview:${ small ? 'small' : 'large' }:255:255`);
    }

    private async load(): Promise<void>
    {
        try
        {
            const baseUrl = this.getBaseUrl();

            if(!baseUrl) return;

            const response = await fetch(`${ baseUrl }habbicons.json`);

            if(!response.ok) return;

            const data = await response.json();
            const habbicons = Array.isArray(data?.habbicons) ? data.habbicons : [];

            for(const habbicon of habbicons)
            {
                const id = Number(habbicon?.id);

                if(!id) continue;

                const previewWidth = this.normalizeDimension(habbicon.width);
                const previewHeight = this.normalizeDimension(habbicon.height);
                const frameData = Array.isArray(habbicon.frameData) ? habbicon.frameData.map(frame => ({
                    id: Number(frame.id) || 0,
                    x: Number(frame.x) || 0,
                    y: Number(frame.y) || 0,
                    width: this.normalizeDimension(frame.width, previewWidth),
                    height: this.normalizeDimension(frame.height, previewHeight)
                })).sort((left, right) => left.id - right.id) : [];
                const steps = this.buildAnimationSteps(habbicon.animation);

                this._definitions.set(id, {
                    id,
                    name: habbicon.name != null ? String(habbicon.name) : '',
                    direction: this.normalizeDirection(habbicon.dir),
                    previewWidth,
                    previewHeight,
                    x: Number(habbicon.x) || 0,
                    y: Number(habbicon.y) || 0,
                    animated: (Number(habbicon.frameCount) > 1) && (frameData.length > 0) && (steps.length > 0),
                    loop: !!habbicon.loop,
                    frameData,
                    steps
                });
            }

            this._spritesheet = await this.loadImage(`${ baseUrl }habbicons_spritesheet.png`);
        }
        catch
        {
            this._definitions.clear();
            this._spritesheet = null;
        }
    }

    private async loadAnimation(habbiconId: number, definition: HabbiconDefinition): Promise<void>
    {
        try
        {
            const baseUrl = this.getBaseUrl();

            if(!baseUrl) return;

            const image = await this.loadImage(`${ baseUrl }animation/${ habbiconId }.png`);

            if(!image) return;

            const frames: HabbiconRuntimeFrame[] = [];

            for(const frame of definition.frameData)
            {
                const canvas = this.createFrameCanvas(image, frame.x, frame.y, frame.width, frame.height, 1);

                if(!canvas) continue;

                frames.push({
                    canvas,
                    smallCanvas: this.scaleCanvas(canvas, 0.5),
                    width: canvas.width,
                    height: canvas.height
                });
            }

            if(!frames.length) return;

            this._runtimeAssets.set(habbiconId, {
                animated: true,
                loop: definition.loop,
                direction: definition.direction,
                baseWidth: definition.previewWidth,
                baseHeight: definition.previewHeight,
                frames,
                steps: definition.steps.length ? definition.steps : [{ sourceFrame: 0, durationMs: 0 }],
                playbackDurationMs: definition.steps.reduce((total, step) => total + Math.max(1, step.durationMs), 0)
            });
        }
        finally
        {
            this._animationLoading.delete(habbiconId);
        }
    }

    private buildFallbackRuntimeAsset(definition: HabbiconDefinition): HabbiconRuntimeAsset
    {
        const source = this.getPreviewSourceCanvas(definition.id, false);
        const small = this.getPreviewSourceCanvas(definition.id, true);
        const frames: HabbiconRuntimeFrame[] = [];

        if(source)
        {
            frames.push({
                canvas: source,
                smallCanvas: small || this.scaleCanvas(source, 0.5),
                width: source.width,
                height: source.height
            });
        }

        return {
            animated: false,
            loop: false,
            direction: definition.direction,
            baseWidth: definition.previewWidth,
            baseHeight: definition.previewHeight,
            frames,
            steps: definition.steps.length ? definition.steps : [{ sourceFrame: 0, durationMs: 0 }],
            playbackDurationMs: 0
        };
    }

    private buildAnimationSteps(animation: any): { sourceFrame: number, durationMs: number }[]
    {
        const steps = Array.isArray(animation?.steps) ? animation.steps : [];
        let playbackSpeed = Number(animation?.playbackSpeed);

        if(!playbackSpeed || playbackSpeed <= 0) playbackSpeed = 1;

        return steps
            .filter(step => step?.enabled !== false)
            .map(step => ({
                sourceFrame: Math.max(0, Number(step.sourceFrame) || 0),
                durationMs: Math.max(1, Math.max(1, Number(step.durationMs) || 100) / playbackSpeed)
            }));
    }

    private createFrameCanvas(image: HTMLImageElement, x: number, y: number, width: number, height: number, scale: number): HTMLCanvasElement
    {
        if(!image) return null;

        const canvas = document.createElement('canvas');

        canvas.width = Math.max(1, Math.round(width * scale));
        canvas.height = Math.max(1, Math.round(height * scale));

        const context = canvas.getContext('2d');

        if(!context) return null;

        context.imageSmoothingEnabled = false;
        context.drawImage(image, x, y, width, height, 0, 0, canvas.width, canvas.height);

        return canvas;
    }

    private scaleCanvas(source: HTMLCanvasElement, scale: number): HTMLCanvasElement
    {
        const canvas = document.createElement('canvas');

        canvas.width = Math.max(1, Math.round(source.width * scale));
        canvas.height = Math.max(1, Math.round(source.height * scale));

        const context = canvas.getContext('2d');

        if(!context) return source;

        context.imageSmoothingEnabled = false;
        context.drawImage(source, 0, 0, canvas.width, canvas.height);

        return canvas;
    }

    private composeBubbleCanvas(source: HTMLCanvasElement, sourceAlpha: number, backgroundAlpha: number, mirrored: boolean): HTMLCanvasElement
    {
        const bitmap = mirrored ? this.mirrorCanvas(source) : source;
        const outline = this.createOutlineCanvas(bitmap);
        const shadow = this.createShadowCanvas(outline);
        const canvas = document.createElement('canvas');

        canvas.width = shadow.width;
        canvas.height = shadow.height;

        const context = canvas.getContext('2d');

        if(!context) return source;

        context.imageSmoothingEnabled = false;
        this.drawLayer(context, shadow, 0, 0, backgroundAlpha);
        this.drawLayer(context, outline, HabbiconAssetManager.SHADOW_PADDING, HabbiconAssetManager.SHADOW_PADDING, backgroundAlpha);
        this.drawLayer(context, bitmap, HabbiconAssetManager.CONTENT_INSET, HabbiconAssetManager.CONTENT_INSET, sourceAlpha);

        return canvas;
    }

    private drawLayer(context: CanvasRenderingContext2D, source: HTMLCanvasElement, x: number, y: number, alpha: number): void
    {
        if(alpha <= 0) return;

        context.save();
        context.globalAlpha = Math.min(1, Math.max(0, alpha / 255));
        context.drawImage(source, x, y);
        context.restore();
    }

    private mirrorCanvas(source: HTMLCanvasElement): HTMLCanvasElement
    {
        const canvas = document.createElement('canvas');

        canvas.width = source.width;
        canvas.height = source.height;

        const context = canvas.getContext('2d');

        if(!context) return source;

        context.imageSmoothingEnabled = false;
        context.translate(source.width, 0);
        context.scale(-1, 1);
        context.drawImage(source, 0, 0);

        return canvas;
    }

    private createOutlineCanvas(source: HTMLCanvasElement): HTMLCanvasElement
    {
        const outline = HabbiconAssetManager.OUTLINE_SIZE;
        const canvas = document.createElement('canvas');

        canvas.width = source.width + (outline * 2);
        canvas.height = source.height + (outline * 2);

        const context = canvas.getContext('2d');

        if(!context) return source;

        const mask = document.createElement('canvas');

        mask.width = source.width;
        mask.height = source.height;

        const maskContext = mask.getContext('2d');

        if(!maskContext) return source;

        maskContext.imageSmoothingEnabled = false;
        maskContext.fillStyle = '#ffffff';
        maskContext.fillRect(0, 0, source.width, source.height);
        maskContext.globalCompositeOperation = 'destination-in';
        maskContext.drawImage(source, 0, 0);

        context.imageSmoothingEnabled = false;

        for(let offsetY = -outline; offsetY <= outline; offsetY++)
        {
            for(let offsetX = -outline; offsetX <= outline; offsetX++)
            {
                if(!offsetX && !offsetY) continue;

                context.drawImage(mask, outline + offsetX, outline + offsetY);
            }
        }

        return canvas;
    }

    private createShadowCanvas(outline: HTMLCanvasElement): HTMLCanvasElement
    {
        const padding = HabbiconAssetManager.SHADOW_PADDING;
        const canvas = document.createElement('canvas');

        canvas.width = outline.width + (padding * 2);
        canvas.height = outline.height + (padding * 2);

        const context = canvas.getContext('2d');

        if(!context) return outline;

        const mask = document.createElement('canvas');

        mask.width = outline.width;
        mask.height = outline.height;

        const maskContext = mask.getContext('2d');

        if(!maskContext) return outline;

        maskContext.fillStyle = '#000000';
        maskContext.fillRect(0, 0, outline.width, outline.height);
        maskContext.globalCompositeOperation = 'destination-in';
        maskContext.drawImage(outline, 0, 0);

        context.imageSmoothingEnabled = false;
        context.save();
        context.globalAlpha = 0.55;
        context.filter = 'blur(6px)';
        context.drawImage(mask, 6.5, 7);
        context.restore();

        return canvas;
    }

    private normalizeDimension(value: any, fallback: number = HabbiconAssetManager.FRAME_SIZE): number
    {
        const parsed = Number(value);

        return parsed > 0 ? parsed : fallback;
    }

    private normalizeDirection(value: any): number
    {
        if(value == null) return 0;

        const parsed = Number(value);

        if(parsed < 0) return -1;

        if(parsed > 0) return 1;

        return 0;
    }

    private getBaseUrl(): string
    {
        const root = GetConfiguration().getValue<string>('habbicons.asset.root', '');
        const hash = GetConfiguration().getValue<string>('habbicons.asset.hash', '');

        if(!root) return '';

        const cleanRoot = root.endsWith('/') ? root : `${ root }/`;

        if(hash && hash.length) return `${ cleanRoot }${ hash }/`;

        return cleanRoot;
    }

    private loadImage(url: string): Promise<HTMLImageElement>
    {
        return new Promise(resolve =>
        {
            const image = new Image();

            image.crossOrigin = 'anonymous';
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = url;
        });
    }
}
