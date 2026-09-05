import type { IRoomCameraWidgetEffect, IRoomCameraWidgetManager, IRoomCameraWidgetSelectedEffect, RoomCameraWidgetBlendMode } from '@octane/api';
import { GetAssetManager } from '@octane/assets';
import { GetConfiguration } from '@octane/configuration';
import { GetEventDispatcher, RoomCameraWidgetManagerEvent } from '@octane/events';
import { TextureUtils } from '@octane/utils';
import 'pixi.js/advanced-blend-modes';
import { ColorMatrixFilter, Container, RenderTexture, Sprite } from 'pixi.js';
import type { ColorMatrix, Texture } from 'pixi.js';
import { RoomCameraWidgetEffect } from './RoomCameraWidgetEffect';

const COLOR_MATRIX_OFFSET_INDICES = [4, 9, 14, 19] as const;
const CAMERA_FRAME_EFFECT_NAMES = new Set(['frame_gold', 'frame_gray_4', 'frame_black_2', 'frame_wood_2', 'finger_nrm']);

type CameraEffectType = 'colormatrix' | 'composite' | 'frame';

interface CameraEffectConfiguration
{
    name: string;
    type?: CameraEffectType;
    colorMatrix?: ColorMatrix;
    minLevel: number;
    blendMode?: RoomCameraWidgetBlendMode | number;
    enabled: boolean;
}

const LEGACY_CAMERA_BLEND_MODES: Readonly<Partial<Record<number, RoomCameraWidgetBlendMode>>> = {
    0: 'normal',
    1: 'add',
    2: 'multiply',
    3: 'screen',
    4: 'overlay',
    5: 'darken',
    6: 'lighten',
    7: 'color-dodge',
    8: 'color-burn',
    9: 'hard-light',
    10: 'soft-light',
    11: 'difference',
    12: 'exclusion',
    14: 'saturation',
    15: 'color',
    16: 'luminosity',
    17: 'normal-npm',
    18: 'add-npm',
    19: 'screen-npm',
    20: 'none'
};

const CAMERA_BLEND_MODES = new Set<RoomCameraWidgetBlendMode>([
    'inherit', 'normal', 'add', 'multiply', 'screen', 'darken', 'lighten', 'erase', 'color-dodge', 'color-burn', 'linear-burn', 'linear-dodge',
    'linear-light', 'hard-light', 'soft-light', 'pin-light', 'difference', 'exclusion', 'overlay', 'saturation', 'color', 'luminosity', 'normal-npm',
    'add-npm', 'screen-npm', 'none', 'subtract', 'divide', 'vivid-light', 'hard-mix', 'negation', 'min', 'max'
]);

export const resolveCameraEffectType = (effect: Pick<CameraEffectConfiguration, 'name' | 'type' | 'colorMatrix'>): CameraEffectType =>
    effect.type ?? (effect.colorMatrix?.length ? 'colormatrix' : (CAMERA_FRAME_EFFECT_NAMES.has(effect.name) ? 'frame' : 'composite'));

export const normalizeCameraBlendMode = (blendMode: RoomCameraWidgetBlendMode | number | string = 'normal'): RoomCameraWidgetBlendMode =>
{
    if(typeof blendMode === 'number') return LEGACY_CAMERA_BLEND_MODES[blendMode] ?? 'normal';
    if(CAMERA_BLEND_MODES.has(blendMode as RoomCameraWidgetBlendMode)) return blendMode as RoomCameraWidgetBlendMode;

    return 'normal';
};

export const normalizeCameraColorMatrix = (matrix: ColorMatrix): ColorMatrix =>
{
    const normalized = [ ...matrix ] as ColorMatrix;

    for(const index of COLOR_MATRIX_OFFSET_INDICES)
    {
        if(Math.abs(normalized[index]) > 1) normalized[index] /= 255;
    }

    for(const [ rowStart, offsetIndex ] of [[0, 4], [5, 9], [10, 14]] as const)
    {
        const rowHasOnlyNegativeWeights =
            (normalized[rowStart] <= 0) &&
            (normalized[rowStart + 1] <= 0) &&
            (normalized[rowStart + 2] <= 0) &&
            ((normalized[rowStart] !== 0) || (normalized[rowStart + 1] !== 0) || (normalized[rowStart + 2] !== 0));

        if((normalized[offsetIndex] === 0) && rowHasOnlyNegativeWeights) normalized[offsetIndex] = 1;
    }

    return normalized;
};

export class RoomCameraWidgetManager implements IRoomCameraWidgetManager
{
    private _effects: Map<string, IRoomCameraWidgetEffect> = new Map();
    private _isLoaded: boolean = false;

    public async init(): Promise<void>
    {
        if(this._isLoaded) return;

        this._isLoaded = true;

        const imagesUrl = GetConfiguration().getValue<string>('image.library.url') + 'Habbo-Stories/';
        const effects = GetConfiguration().getValue<CameraEffectConfiguration[]>('camera.available.effects');

        for(const effect of effects)
        {
            if(!effect.enabled) continue;

            const cameraEffect = new RoomCameraWidgetEffect(effect.name, effect.minLevel, resolveCameraEffectType(effect));

            if(effect.colorMatrix?.length)
            {
                cameraEffect.colorMatrix = normalizeCameraColorMatrix(effect.colorMatrix);
            }
            else
            {
                const url = `${ imagesUrl }${ effect.name }.png`;

                await GetAssetManager().downloadAsset(url);

                cameraEffect.texture = GetAssetManager().getTexture(url);
                cameraEffect.blendMode = normalizeCameraBlendMode(effect.blendMode);
            }

            this._effects.set(cameraEffect.name, cameraEffect);
        }

        GetEventDispatcher().dispatchEvent(new RoomCameraWidgetManagerEvent(RoomCameraWidgetManagerEvent.INITIALIZED));
    }

    public async applyEffects(texture: Texture, effects: IRoomCameraWidgetSelectedEffect[], isZoomed: boolean): Promise<HTMLImageElement>
    {
        const resolution = texture.source.resolution || 1;
        const renderTextureA = RenderTexture.create({ width: texture.width, height: texture.height, resolution });
        const renderTextureB = RenderTexture.create({ width: texture.width, height: texture.height, resolution });
        const baseSprite = new Sprite(texture);
        const identityMatrix: ColorMatrix = [1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0];

        try
        {
            if(isZoomed)
            {
                baseSprite.scale.set(2);
                baseSprite.position.set(-texture.width / 2, -texture.height / 2);
            }

            TextureUtils.writeToTexture(baseSprite, renderTextureA);

            const effectOrder = new Map(Array.from(this._effects.keys()).map((name, index) => [name, index]));
            const orderedEffects = [...effects]
                .filter(selectedEffect => !!selectedEffect.effect)
                .sort((a, b) => (effectOrder.get(a.effect.name) ?? Number.MAX_SAFE_INTEGER) - (effectOrder.get(b.effect.name) ?? Number.MAX_SAFE_INTEGER));
            const nonFrameEffects = orderedEffects.filter(selectedEffect => selectedEffect.effect.type !== 'frame');
            const frameEffects = orderedEffects.filter(selectedEffect => selectedEffect.effect.type === 'frame');
            let currentTexture = renderTextureA;
            let nextTexture = renderTextureB;

            const applyEffect = (selectedEffect: IRoomCameraWidgetSelectedEffect): void =>
            {
                const effect = selectedEffect.effect;
                const stage = new Container();
                const currentSprite = new Sprite(currentTexture);
                let filter: ColorMatrixFilter = null;

                try
                {
                    stage.addChild(currentSprite);

                    if((effect.type === 'colormatrix') && effect.colorMatrix)
                    {
                        filter = new ColorMatrixFilter();
                        filter.matrix = effect.colorMatrix.map((value, index) => identityMatrix[index] + (value - identityMatrix[index]) * selectedEffect.strength) as ColorMatrix;
                        currentSprite.filters = [filter];
                    }
                    else if(effect.texture)
                    {
                        const effectSprite = new Sprite(effect.texture);

                        effectSprite.width = texture.width;
                        effectSprite.height = texture.height;
                        effectSprite.alpha = (effect.type === 'frame') ? 1 : selectedEffect.strength;
                        effectSprite.blendMode = (effect.type === 'frame') ? 'normal' : (effect.blendMode ?? 'normal');

                        stage.addChild(effectSprite);
                    }

                    TextureUtils.writeToTexture(stage, nextTexture);
                }
                finally
                {
                    stage.destroy({ children: true });
                    filter?.destroy();
                }

                [currentTexture, nextTexture] = [nextTexture, currentTexture];
            };

            for(const selectedEffect of nonFrameEffects) applyEffect(selectedEffect);
            for(const selectedEffect of frameEffects) applyEffect(selectedEffect);

            return await TextureUtils.generateImage(currentTexture);
        }
        finally
        {
            baseSprite.destroy();
            renderTextureA.destroy(true);
            renderTextureB.destroy(true);
        }
    }

    public get effects(): Map<string, IRoomCameraWidgetEffect>
    {
        return this._effects;
    }

    public get isLoaded(): boolean
    {
        return this._isLoaded;
    }
}
