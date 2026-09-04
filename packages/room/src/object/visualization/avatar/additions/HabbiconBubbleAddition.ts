import { AvatarAction, IRoomObjectSprite } from '@nitrots/api';
import { Texture } from 'pixi.js';
import { AvatarVisualization } from '../AvatarVisualization';
import { HabbiconAssetManager, HabbiconRuntimeAsset } from './HabbiconAssetManager';
import { IAvatarAddition } from './IAvatarAddition';

export class HabbiconBubbleAddition implements IAvatarAddition
{
    private static DEFAULT_VISIBLE_DURATION_MS: number = 3000;
    private static INTRO_DURATION_MS: number = 180;
    private static INTRO_START_OFFSET_Y: number = 12;
    private static FADE_IN_DURATION_MS: number = 150;
    private static FADE_OUT_DURATION_MS: number = 350;
    private static BACKGROUND_VISIBLE_DURATION_MS: number = 3350;
    private static BACKGROUND_FADE_OUT_DURATION_MS: number = 530;
    private static ROOM_LARGE_OFFSET_X: number = -20;
    private static ROOM_LARGE_OFFSET_Y: number = -126;
    private static ROOM_SMALL_OFFSET_X: number = -10;
    private static ROOM_SMALL_OFFSET_Y: number = -65;
    private static DEFAULT_RELATIVE_DEPTH: number = -0.2;

    private _runtime: HabbiconRuntimeAsset = null;
    private _scale: number = 64;
    private _startedAt: number = 0;
    private _sourceHideAt: number = 0;
    private _sourceFadeOutAt: number = 0;
    private _backgroundHideAt: number = 0;
    private _backgroundFadeOutAt: number = 0;
    private _completeAt: number = 0;
    private _frameIndex: number = 0;
    private _lastSourceAlpha: number = -1;
    private _lastBackgroundAlpha: number = -1;
    private _composed: boolean = false;
    private _bitmapWidth: number = 0;
    private _bitmapHeight: number = 0;
    private _wasAnimated: boolean = false;
    private _started: boolean = false;
    private _complete: boolean = false;
    private _mirrorResolved: boolean = false;
    private _mirrored: boolean = false;

    constructor(
        private _id: number,
        private _habbiconId: number,
        private _triggerSequence: number,
        private _visualization: AvatarVisualization)
    {}

    public dispose(): void
    {
        this._runtime = null;
        this._visualization = null;
    }

    public update(sprite: IRoomObjectSprite, scale: number): void
    {
        if(!sprite) return;

        this._scale = scale;

        const firstUpdate = !this._started;

        this.ensureStarted();

        if(this.isComplete(Date.now()))
        {
            this.hide(sprite);
            return;
        }

        this.syncRuntime();
        this.applyFrame(sprite, this.resolveTexture(this.resolveAlpha(Date.now()), this.resolveBackgroundAlpha(Date.now())));
        this.applyOffsets(sprite, Date.now() - this._startedAt, true);

        if(firstUpdate && sprite.texture)
        {
            sprite.visible = true;
            sprite.alpha = 255;
        }
    }

    public animate(sprite: IRoomObjectSprite): boolean
    {
        if(!sprite) return false;

        this.ensureStarted();
        this.syncRuntime();

        const now = Date.now();

        if(this.isComplete(now))
        {
            this.hide(sprite);
            return true;
        }

        const elapsed = now - this._startedAt;
        const frameIndex = this.resolveFrameIndex(elapsed);
        const sourceAlpha = this.resolveAlpha(now);
        const backgroundAlpha = this.resolveBackgroundAlpha(now);
        let changed = false;

        if(this._runtime && frameIndex !== this._frameIndex)
        {
            this._frameIndex = frameIndex;
            changed = true;
        }

        if(sourceAlpha !== this._lastSourceAlpha || backgroundAlpha !== this._lastBackgroundAlpha)
        {
            changed = true;
        }

        if(changed) this.applyFrame(sprite, this.resolveTexture(sourceAlpha, backgroundAlpha));

        sprite.relativeDepth = HabbiconBubbleAddition.DEFAULT_RELATIVE_DEPTH;
        this.applyOffsets(sprite, elapsed, false);

        if(sprite.alpha !== 255)
        {
            sprite.alpha = 255;
            changed = true;
        }

        sprite.visible = Math.max(sourceAlpha, backgroundAlpha) > 0;

        return true;
    }

    public get id(): number
    {
        return this._id;
    }

    public get habbiconId(): number
    {
        return this._habbiconId;
    }

    public get triggerSequence(): number
    {
        return this._triggerSequence;
    }

    private applyOffsets(sprite: IRoomObjectSprite, elapsed: number, fromUpdate: boolean): void
    {
        const small = this._scale < 48;
        const offsetX = small ? HabbiconBubbleAddition.ROOM_SMALL_OFFSET_X : HabbiconBubbleAddition.ROOM_LARGE_OFFSET_X;
        let offsetY = small ? HabbiconBubbleAddition.ROOM_SMALL_OFFSET_Y : HabbiconBubbleAddition.ROOM_LARGE_OFFSET_Y;

        if(fromUpdate)
        {
            const additionScale = small ? 32 : 64;

            if(this._visualization.posture === AvatarAction.POSTURE_SIT) offsetY += (additionScale / 2);
            else if(this._visualization.posture === AvatarAction.POSTURE_LAY) offsetY += additionScale;
        }
        else
        {
            if(this._visualization.posture === AvatarAction.POSTURE_SIT) offsetY += 32;
            else if(this._visualization.posture === AvatarAction.POSTURE_LAY) offsetY += 64;
        }

        sprite.offsetX = offsetX + this.resolveFrameAnchorCompensationX();
        sprite.offsetY = offsetY + this.getIntroOffsetY(elapsed) + this.resolveFrameAnchorCompensationY();
        sprite.relativeDepth = HabbiconBubbleAddition.DEFAULT_RELATIVE_DEPTH;
    }

    private applyFrame(sprite: IRoomObjectSprite, texture: Texture): void
    {
        if(!texture) return;

        sprite.texture = texture;
        this._bitmapWidth = texture.width;
        this._bitmapHeight = texture.height;
        this._composed = true;
    }

    private resolveTexture(sourceAlpha: number, backgroundAlpha: number): Texture
    {
        const small = this._scale < 48;
        const source = HabbiconAssetManager.getInstance().getSourceCanvas(this._habbiconId, this._frameIndex, small);

        if(!source)
        {
            this._composed = false;
            return HabbiconAssetManager.getInstance().getPreviewTexture(this._habbiconId, small);
        }

        this._lastSourceAlpha = sourceAlpha;
        this._lastBackgroundAlpha = backgroundAlpha;

        const mirrored = this.shouldMirrorHabbicon();
        const cacheKey = `${ this._habbiconId }:${ this._runtime?.animated ? 'animated' : 'runtime' }:${ small ? 'small' : 'large' }:${ this._frameIndex }:${ mirrored ? 'm' : 'n' }:${ sourceAlpha }:${ backgroundAlpha }`;

        this._composed = true;
        this._bitmapWidth = source.width + 4 + 10;
        this._bitmapHeight = source.height + 4 + 10;

        return HabbiconAssetManager.getInstance().composeTexture(source, sourceAlpha, backgroundAlpha, mirrored, cacheKey);
    }

    private ensureStarted(): void
    {
        if(this._started) return;

        this._runtime = HabbiconAssetManager.getInstance().getRuntimeAsset(this._habbiconId);
        this._wasAnimated = !!this._runtime?.animated;
        this._startedAt = Date.now();
        this._frameIndex = this.resolveFrameIndex(0);
        this.configureTiming();
        this._started = true;
    }

    private syncRuntime(): void
    {
        this._runtime = HabbiconAssetManager.getInstance().getRuntimeAsset(this._habbiconId);

        if(this._runtime && this._runtime.animated !== this._wasAnimated)
        {
            this._wasAnimated = this._runtime.animated;
            this.configureTiming();
        }
    }

    private isComplete(now: number): boolean
    {
        return this._complete || (this._completeAt > this._startedAt && now >= this._completeAt);
    }

    private hide(sprite: IRoomObjectSprite): void
    {
        this._complete = true;
        sprite.alpha = 0;
        sprite.visible = false;
    }

    private configureTiming(): void
    {
        if(!this._startedAt) return;

        const sourceHideAt = this._startedAt + Math.max(HabbiconBubbleAddition.DEFAULT_VISIBLE_DURATION_MS, 500);
        const backgroundHideAt = this._startedAt + Math.max(HabbiconBubbleAddition.BACKGROUND_VISIBLE_DURATION_MS, 680);

        this._sourceHideAt = sourceHideAt;
        this._sourceFadeOutAt = sourceHideAt - HabbiconBubbleAddition.FADE_OUT_DURATION_MS;
        this._backgroundHideAt = backgroundHideAt;
        this._backgroundFadeOutAt = backgroundHideAt - HabbiconBubbleAddition.BACKGROUND_FADE_OUT_DURATION_MS;
        this._completeAt = Math.max(sourceHideAt, backgroundHideAt);
    }

    private resolveFrameIndex(elapsed: number): number
    {
        const step = this.getCurrentStep(elapsed);

        if(!this._runtime?.frames?.length) return 0;

        if(!step) return 0;

        return Math.max(0, Math.min(step.sourceFrame, this._runtime.frames.length - 1));
    }

    private getCurrentStep(elapsed: number): { sourceFrame: number, durationMs: number }
    {
        if(!this._runtime?.steps?.length) return null;

        const steps = this._runtime.steps;

        if(steps.length === 1) return steps[0];

        let total = 0;

        for(const step of steps) total += Math.max(1, step.durationMs);

        if(total <= 0) return steps[0];

        let time = elapsed;

        if(this._runtime.animated) time %= total;
        else if(time >= total) return steps[steps.length - 1];

        total = 0;

        for(const step of steps)
        {
            total += Math.max(1, step.durationMs);

            if(time < total) return step;
        }

        return steps[steps.length - 1];
    }

    private getIntroOffsetY(elapsed: number): number
    {
        const progress = Math.min(1, Math.max(0, elapsed / HabbiconBubbleAddition.INTRO_DURATION_MS));

        return Math.round((1 - progress) * HabbiconBubbleAddition.INTRO_START_OFFSET_Y);
    }

    private resolveAlpha(now: number): number
    {
        if(!this._startedAt || this._sourceFadeOutAt <= this._startedAt) return 255;

        const fadeIn = Math.min(1, Math.max(0, (now - this._startedAt) / HabbiconBubbleAddition.FADE_IN_DURATION_MS));
        const fadeOut = now < this._sourceFadeOutAt ? 1 : 1 - Math.min(1, Math.max(0, (now - this._sourceFadeOutAt) / HabbiconBubbleAddition.FADE_OUT_DURATION_MS));

        if(this._sourceHideAt > this._startedAt && now >= this._sourceHideAt) return 0;

        return Math.round(255 * Math.min(fadeIn, fadeOut));
    }

    private resolveBackgroundAlpha(now: number): number
    {
        if(!this._startedAt || this._backgroundFadeOutAt <= this._startedAt) return 255;

        const fadeIn = Math.min(1, Math.max(0, (now - this._startedAt) / HabbiconBubbleAddition.FADE_IN_DURATION_MS));
        const fadeOut = now < this._backgroundFadeOutAt ? 1 : 1 - Math.min(1, Math.max(0, (now - this._backgroundFadeOutAt) / HabbiconBubbleAddition.BACKGROUND_FADE_OUT_DURATION_MS));

        return Math.round(255 * Math.min(fadeIn, fadeOut));
    }

    private resolveFrameAnchorCompensationX(): number
    {
        if(!this._bitmapWidth) return 0;

        if(!this._runtime) return this._composed ? -7 : 0;

        const baseWidth = this.resolveBaseDimension(this._runtime.baseWidth);

        return Math.round((baseWidth - this._bitmapWidth) * 0.5);
    }

    private resolveFrameAnchorCompensationY(): number
    {
        if(!this._bitmapHeight) return 0;

        if(!this._runtime) return this._composed ? -7 : 0;

        const baseHeight = this.resolveBaseDimension(this._runtime.baseHeight);

        return baseHeight - this._bitmapHeight + (this._composed ? 7 : 0);
    }

    private resolveBaseDimension(value: number): number
    {
        if(this._scale < 48) return Math.max(1, Math.round(value * 0.5));

        return Math.max(1, value);
    }

    private shouldMirrorHabbicon(): boolean
    {
        if(!this._mirrorResolved)
        {
            const facing = this._visualization?.habbiconFacingDirection || 0;
            const assetDirection = HabbiconAssetManager.getInstance().getDirection(this._habbiconId);

            this._mirrored = facing !== 0 && assetDirection !== 0 && facing !== assetDirection;
            this._mirrorResolved = true;
        }

        return this._mirrored;
    }
}
