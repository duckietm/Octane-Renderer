import { Container, Texture } from 'pixi.js';
import { IGraphicAsset } from '../../asset/IGraphicAsset';
import { RoomObjectSpriteData } from '../../room/RoomObjectSpriteData';
import { IActiveActionData } from './actions';
import { IAvatarFigureContainer } from './IAvatarFigureContainer';
import { IAnimationLayerData, ISpriteDataContainer } from './animation';
import { IPartColor } from './structure';

export interface IAvatarImage
{
    dispose(): void;
    /** Frees cached actions the avatar hasn't used for a while; they are rebuilt when needed. */
    disposeInactiveActions(): void;
    setDirection(setType: string, direction: number): void;
    setDirectionAngle(setType: string, angle: number): void;
    updateAnimationByFrames(frameCount?: number): void;
    getScale(): string;
    /** An avatar or effect asset by name, following the avatar's asset aliases. */
    getAsset(name: string): IGraphicAsset;
    getSprites(): ISpriteDataContainer[];
    getLayerData(sprite: ISpriteDataContainer): IAnimationLayerData;
    /**
     * deferred: the caller shows the texture in the room this frame, so it may be an atlas cell whose
     * pixels are only drawn when the room engine flushes the atlas, just before the stage renders.
     */
    processAsTexture(setType: string, hightlight: boolean, deferred?: boolean): Texture;
    /** Gives the atlas cells of kept frames back; the image draws again when it is shown later. */
    releaseCachedFrames?(): void;
    /** Grows each time processAsTexture may have drawn a new frame; the same value means the same picture. */
    readonly textureRevision?: number;
    processAsImageUrl(setType: string): string;
    processAsCroppedImageUrl(setType: string, trimTransparentPixels?: boolean): string;
    processAsContainer(setType: string): Container;
    getDirection(): number;
    getDirectionOffset(): number;
    getFigure(): IAvatarFigureContainer;
    getPartColor(partType: string): IPartColor;
    getMainAction(): IActiveActionData;
    getEffectId(): number;
    isAnimating(): boolean;
    getCanvasOffsets(): number[];
    initActionAppends(): void;
    endActionAppends(): void;
    appendAction(action: string, ..._args: any[]): boolean;
    isPlaceholder(): boolean;
    animationHasResetOnToggle: boolean;
    resetAnimationFrameCounter(): void;
    /** The full figure as camera scene sprites, one per drawn part (AIR AvatarImage.getServerRenderData). */
    getServerRenderData(): RoomObjectSpriteData[];
}
