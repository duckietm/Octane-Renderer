import { AvatarAction, IRoomObjectVariableFxEntry, IRoomObjectVariableFxVisualizer, RoomObjectVariable } from '@octane/api';
import { Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VariableFxStackAddition } from '../avatar/additions/VariableFxStackAddition';
import { FurnitureVisualization } from '../furniture/FurnitureVisualization';
import { RoomObjectModel } from '../../RoomObjectModel';
import { RoomObjectSprite } from '../RoomObjectSprite';
import { VariableFxStack } from './VariableFxStack';

const visualizer = (width: number, height: number): IRoomObjectVariableFxVisualizer => ({
    frame: { source: {} as CanvasImageSource, width, height, anchorX: 0, anchorY: 0, updateId: 1 },
    needsUpdate: () => false,
    update: () => false
});

const entry = (key: string, width = 30, height = 10): IRoomObjectVariableFxEntry => ({
    key,
    layer: 0,
    createdAt: 0,
    configId: 1,
    variableId: key,
    visible: true,
    visualizer: visualizer(width, height)
});

const fakeTexture = (width: number, height: number) => ({ width, height, destroyed: false, source: { update: () => undefined }, destroy()
{
    this.destroyed = true;
} }) as unknown as Texture;

describe('variable fx stack on its holders', () =>
{
    beforeEach(() =>
    {
        vi.useFakeTimers();
        vi.setSystemTime(10000);

        const context = { globalAlpha: 1, setTransform: () => undefined, clearRect: () => undefined, drawImage: () => undefined };

        vi.spyOn(VariableFxStack.prototype as unknown as { createCanvas: () => unknown }, 'createCanvas').mockImplementation((...args: unknown[]) => ({ width: args[0], height: args[1], getContext: () => context }));
        vi.spyOn(VariableFxStack.prototype as unknown as { createTexture: () => unknown }, 'createTexture').mockImplementation(() => fakeTexture(1, 1));
    });

    afterEach(() =>
    {
        vi.restoreAllMocks();
        vi.useRealTimers();
    });

    it('puts the avatar stack bottom where AIR does for the zoom and posture', () =>
    {
        expect(VariableFxStackAddition.resolveStackBottomY(64, AvatarAction.POSTURE_STAND)).toBe(-86);
        expect(VariableFxStackAddition.resolveStackBottomY(32, AvatarAction.POSTURE_STAND)).toBe(-45);
        expect(VariableFxStackAddition.resolveStackBottomY(64, AvatarAction.POSTURE_SIT)).toBe(-54);
        expect(VariableFxStackAddition.resolveStackBottomY(32, AvatarAction.POSTURE_SIT)).toBe(-29);
        expect(VariableFxStackAddition.resolveStackBottomY(64, AvatarAction.POSTURE_LAY)).toBe(-22);
    });

    it('fades the avatar stack in and, once gone, out over 350 ms on the clock', () =>
    {
        const holder = { posture: AvatarAction.POSTURE_STAND };
        const addition = new VariableFxStackAddition(9, holder);
        const sprite = new RoomObjectSprite();

        addition.setEntries([ entry('a', 40, 12) ]);
        addition.update(sprite, 64);

        expect(sprite.visible).toBe(false);

        vi.advanceTimersByTime(150);
        expect(addition.animate(sprite)).toBe(true);
        expect(sprite.visible).toBe(true);
        expect(sprite.offsetX).toBe(-20);
        expect(sprite.offsetY).toBe(-86 - 12);

        holder.posture = AvatarAction.POSTURE_SIT;
        expect(addition.animate(sprite)).toBe(true);
        expect(sprite.offsetY).toBe(-54 - 12);

        addition.setEntries([]);
        vi.advanceTimersByTime(349);
        addition.animate(sprite);
        expect(sprite.visible).toBe(true);

        vi.advanceTimersByTime(1);
        addition.animate(sprite);
        expect(sprite.visible).toBe(false);
        expect(addition.stack.isEmpty).toBe(true);
    });

    it('adds the furni stack as an extra sprite over its layers and drops it after the fade-out', () =>
    {
        const visualization = new FurnitureVisualization();
        const model = new RoomObjectModel();
        const internals = visualization as unknown as { createSprites(count: number): void, updateVariableFx(): boolean };

        visualization.object = { model } as never;
        internals.createSprites(2);

        const left = visualization.getSprite(0);
        const right = visualization.getSprite(1);

        left.texture = fakeTexture(40, 30);
        left.offsetX = -32;
        left.offsetY = -20;
        right.texture = fakeTexture(20, 50);
        right.offsetX = 0;
        right.offsetY = -40;

        expect(visualization.sprites).toHaveLength(2);

        model.setValue(RoomObjectVariable.VARIABLE_FX_STACK, [ entry('a', 30, 10) ]);
        internals.updateVariableFx();
        vi.advanceTimersByTime(150);
        expect(internals.updateVariableFx()).toBe(true);

        const sprites = visualization.sprites;
        const fx = sprites[2];

        expect(sprites).toHaveLength(3);
        // Centre of -32..20 is -6; the stack bottom is 4 px above the top (-40).
        expect(fx.offsetX).toBe(-6 - 15);
        expect(fx.offsetY).toBe(-44 - 10);
        expect(fx.relativeDepth).toBe(-0.2);
        expect(fx.skipMouseHandling).toBe(true);
        expect(visualization.totalSprites).toBe(2);

        model.setValue(RoomObjectVariable.VARIABLE_FX_STACK, []);
        internals.updateVariableFx();
        vi.advanceTimersByTime(200);
        internals.updateVariableFx();
        expect(visualization.sprites).toHaveLength(3);

        vi.advanceTimersByTime(150);
        internals.updateVariableFx();
        expect(visualization.sprites).toHaveLength(2);
    });

    it('hides the furni stack while the furni draws nothing', () =>
    {
        const visualization = new FurnitureVisualization();
        const model = new RoomObjectModel();
        const internals = visualization as unknown as { updateVariableFx(): boolean };

        visualization.object = { model } as never;
        model.setValue(RoomObjectVariable.VARIABLE_FX_STACK, [ entry('a') ]);
        vi.advanceTimersByTime(150);
        internals.updateVariableFx();

        expect(visualization.sprites).toHaveLength(0);
    });
});
