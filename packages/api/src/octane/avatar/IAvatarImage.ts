import { Container, Texture } from 'pixi.js';
import { IActiveActionData } from './actions';
import { IAvatarFigureContainer } from './IAvatarFigureContainer';
import { IAnimationLayerData, ISpriteDataContainer } from './animation';
import { IPartColor } from './structure';

export interface IAvatarImage
{
    dispose(): void;
    setDirection(setType: string, direction: number): void;
    setDirectionAngle(setType: string, angle: number): void;
    updateAnimationByFrames(frameCount?: number): void;
    getScale(): string;
    getSprites(): ISpriteDataContainer[];
    getLayerData(sprite: ISpriteDataContainer): IAnimationLayerData;
    processAsTexture(setType: string, hightlight: boolean, texture?: Texture): Texture;
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
}
