import type { BLEND_MODES as PixiBlendMode, ColorMatrix, Texture } from 'pixi.js';

export type RoomCameraWidgetBlendMode = PixiBlendMode;

export interface IRoomCameraWidgetEffect
{
    name: string;
    type: 'colormatrix' | 'composite' | 'frame';
    minLevel: number;
    texture: Texture;
    colorMatrix: ColorMatrix;
    blendMode: RoomCameraWidgetBlendMode;
}
