import { describe, expect, it } from 'vitest';
import { AvatarVisualization } from './AvatarVisualization';

// AIR build of 4 November 2026 (AvatarVisualization.getSpriteList): the camera sprites of effects and the shadow are
// lifted by the avatar body layer's own offset, and the shadow gets a depth relative to the body sprite.

type SpriteData = { id: string, member: string, hasDirections: boolean, hasStaticY: boolean, ink: number, getDirectionOffsetX(d: number): number, getDirectionOffsetY(d: number): number, getDirectionOffsetZ(d: number): number };

const spriteData = (id: string, offsetY: number): SpriteData => ({
    id,
    member: id,
    hasDirections: false,
    hasStaticY: false,
    ink: 0,
    getDirectionOffsetX: () => 0,
    getDirectionOffsetY: () => offsetY,
    getDirectionOffsetZ: () => 0
});

const spriteList = (canStandUp: boolean) =>
{
    const visualization = Object.create(AvatarVisualization.prototype) as AvatarVisualization;
    const body = spriteData('avatar', 4);
    const effect = spriteData('fx', 2);
    const sprites = { 0: { relativeDepth: 0.5 }, 1: { visible: true, libraryAssetName: 'sh_std_sd_1_0_0', alpha: 50, offsetX: -10, offsetY: -8, width: 20, height: 10, relativeDepth: 1 } };

    Object.assign(visualization as unknown as Record<string, unknown>, {
        _canStandUp: canStandUp,
        _isLaying: false,
        _verticalOffset: 0,
        getSprite: (index: number) => sprites[index as 0 | 1],
        _avatarImage: {
            getServerRenderData: (): unknown[] => [],
            getDirection: () => 2,
            getScale: () => 'h',
            getSprites: () => [ body, effect ],
            getLayerData: (data: SpriteData) => (data === body ? { dx: 0, dy: 3, dd: 0, animationFrame: 0 } : null),
            getAsset: () => ({ offsetX: 0, offsetY: -20, rectangle: { width: 30, height: 40 } })
        }
    });
    Object.defineProperty(visualization, 'spriteCount', { value: 2 });

    const list = visualization.getSpriteList();

    return { effect: list.find(data => data.name === 'h_fx_0_0'), shadow: list.find(data => data.name === 'sh_std_sd_1_0_0') };
};

describe('AvatarVisualization getSpriteList', () =>
{
    it('lifts effect sprites and the shadow by the body layer offset', () =>
    {
        const { effect, shadow } = spriteList(false);

        // Body layer: direction offset 4 + animation dy 3.
        expect(effect.y).toBe(-20 + 2 - 7);
        expect(shadow.y).toBe(-8 - 7);
    });

    it('leaves the offset out while the avatar sits where it can stand up', () =>
    {
        const { effect, shadow } = spriteList(true);

        expect(effect.y).toBe(-20 + 2);
        expect(shadow.y).toBe(-8);
    });

    it('gives the shadow a depth relative to the body sprite', () =>
    {
        expect(spriteList(false).shadow.z).toBe(0.5);
    });
});
