import { IRoomObjectVariableFxEntry, IRoomObjectVariableFxFrame, IRoomObjectVariableFxVisualizer } from '@octane/api';
import { Texture } from 'pixi.js';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { RoomObjectSprite } from '../RoomObjectSprite';
import { compareVariableFxStackEntries, layoutVariableFxStack, VariableFxStack } from './VariableFxStack';
import { VariableFxStackEntry } from './VariableFxStackEntry';
import { VariableFxStackMotion } from './VariableFxStackMotion';

class FakeVisualizer implements IRoomObjectVariableFxVisualizer
{
    public frame: IRoomObjectVariableFxFrame;
    public pending = 0;
    public updates = 0;

    constructor(width: number, height: number, public readonly name: string = 'fx')
    {
        this.frame = { source: { name } as unknown as CanvasImageSource, width, height, anchorX: 0, anchorY: 0, updateId: 0 };
    }

    public needsUpdate(): boolean
    {
        return (this.pending > 0);
    }

    public update(): boolean
    {
        this.pending--;
        this.updates++;
        this.frame = { ...this.frame, updateId: this.frame.updateId + 1 };

        return true;
    }
}

interface DrawCall { name: string; x: number; y: number; alpha: number }

class TestStack extends VariableFxStack
{
    public draws: DrawCall[] = [];
    public canvases: { width: number, height: number }[] = [];
    public textures: { destroyed: boolean }[] = [];

    protected createCanvas(width: number, height: number): HTMLCanvasElement
    {
        const draws = this.draws;
        const context = {
            globalAlpha: 1,
            setTransform: () => undefined,
            clearRect: () =>
            {
                draws.length = 0;
            },
            drawImage(source: { name: string }, x: number, y: number)
            {
                draws.push({ name: source.name, x, y, alpha: Math.round(this.globalAlpha * 255) });
            }
        };
        const canvas = { width, height, getContext: () => context };

        this.canvases.push(canvas);

        return canvas as unknown as HTMLCanvasElement;
    }

    protected createTexture(): Texture
    {
        const texture = { width: 1, height: 1, destroyed: false, source: { update: () => undefined }, destroy()
        {
            this.destroyed = true;
        } };

        this.textures.push(texture);

        return texture as unknown as Texture;
    }

    protected updateTexture(): void
    {
        return;
    }
}

const entry = (key: string, visualizer: IRoomObjectVariableFxVisualizer, overrides: Partial<IRoomObjectVariableFxEntry> = {}): IRoomObjectVariableFxEntry => ({
    key,
    layer: 0,
    createdAt: 0,
    configId: 1,
    variableId: key,
    visible: true,
    visualizer,
    ...overrides
});

describe('VariableFxStackMotion', () =>
{
    it('slides to the target without overshooting and stops on it', () =>
    {
        const motion = new VariableFxStackMotion(0.003, 0.35, 0.01, 0.004);

        motion.reset(0, 0);
        motion.setTarget(-30, 0);

        let previous = 0;

        for(let time = 16; time <= 2000; time += 16)
        {
            motion.update(time);

            expect(motion.value).toBeLessThanOrEqual(previous);
            expect(motion.value).toBeGreaterThanOrEqual(-30);

            previous = motion.value;
        }

        expect(motion.value).toBe(-30);
        expect(motion.needsUpdate(2000)).toBe(false);
    });

    it('moves no faster than its cap', () =>
    {
        const motion = new VariableFxStackMotion(0.003, 0.35, 0.01, 0.004);

        motion.reset(0, 0);
        motion.setTarget(1000, 0);
        motion.update(1000);

        expect(motion.value).toBeLessThanOrEqual(350);
        expect(motion.needsUpdate(1000)).toBe(true);
    });
});

describe('VariableFxStackEntry fades', () =>
{
    it('fades in over 150 ms', () =>
    {
        const fx = new VariableFxStackEntry('a');

        fx.show(entry('a', new FakeVisualizer(10, 10)), 0);

        expect(fx.alpha).toBe(0);

        fx.updateFade(75);
        expect(fx.alpha).toBe(128);

        fx.updateFade(150);
        expect(fx.alpha).toBe(255);
        expect(fx.isFading).toBe(false);
    });

    it('fades out over 350 ms when it is gone, then is finished', () =>
    {
        const fx = new VariableFxStackEntry('a');

        fx.show(entry('a', new FakeVisualizer(10, 10)), 0);
        fx.updateFade(150);
        fx.hide(1000);

        expect(fx.takesSlot).toBe(false);

        fx.updateFade(1175);
        expect(fx.alpha).toBe(128);
        expect(fx.isFinished).toBe(false);

        fx.updateFade(1350);
        expect(fx.alpha).toBe(0);
        expect(fx.isFinished).toBe(true);
    });

    it('fades a hidden fx out but keeps it, and fades it back in from where it was', () =>
    {
        const fx = new VariableFxStackEntry('a');
        const visualizer = new FakeVisualizer(10, 10);

        fx.show(entry('a', visualizer), 0);
        fx.updateFade(150);
        fx.show(entry('a', visualizer, { visible: false }), 1000);
        fx.updateFade(1350);

        expect(fx.alpha).toBe(0);
        expect(fx.isFinished).toBe(false);

        fx.show(entry('a', visualizer), 2000);
        fx.updateFade(2150);

        expect(fx.alpha).toBe(255);
        expect(fx.takesSlot).toBe(true);
    });

    it('fading back in during a fade-out starts from the current alpha', () =>
    {
        const fx = new VariableFxStackEntry('a');
        const visualizer = new FakeVisualizer(10, 10);

        fx.show(entry('a', visualizer), 0);
        fx.updateFade(150);
        fx.hide(1000);
        fx.updateFade(1175);
        fx.show(entry('a', visualizer), 1175);
        fx.updateFade(1250);

        expect(fx.alpha).toBe(Math.round(128 + (127 * 0.5)));
        expect(fx.isFinished).toBe(false);
    });
});

describe('layoutVariableFxStack', () =>
{
    const shown = (key: string, width: number, height: number, overrides: Partial<IRoomObjectVariableFxEntry> = {}) =>
    {
        const fx = new VariableFxStackEntry(key);

        fx.show(entry(key, new FakeVisualizer(width, height, key), overrides), 0);
        fx.updateFade(150);

        return fx;
    };

    it('piles the entries bottom up, 4 px apart, centred on the axis', () =>
    {
        const layout = layoutVariableFxStack([ shown('a', 40, 10), shown('b', 21, 8) ], 200, true);

        expect(layout.pieces.map(piece => [ piece.x, piece.y ])).toEqual([ [ -20, -10 ], [ -10, -22 ] ]);
        expect(layout).toMatchObject({ minX: -20, minY: -22, width: 40, height: 22, moving: false });
    });

    it('keeps a fading entry where it was while the one above slides into its slot', () =>
    {
        const bottom = shown('a', 20, 10);
        const middle = shown('b', 20, 10);
        const top = shown('c', 20, 10);
        const entries = [ bottom, middle, top ];

        layoutVariableFxStack(entries, 200, true);

        expect(top.y.value).toBe(-28);

        middle.hide(300);
        middle.updateFade(400);

        let layout = layoutVariableFxStack(entries, 400, true);

        expect(middle.y.value).toBe(-14);
        expect(layout.moving).toBe(true);

        for(let time = 416; time <= 1400; time += 16)
        {
            middle.updateFade(time);
            layout = layoutVariableFxStack(entries, time, true);
        }

        expect(top.y.value).toBe(-14);
        expect(layout.moving).toBe(false);
        expect(layout.pieces.map(piece => piece.entry.key)).toEqual([ 'a', 'c' ]);
    });

    it('skips entries without a frame or fully faded out', () =>
    {
        const empty = new VariableFxStackEntry('x');

        empty.show(entry('x', new FakeVisualizer(0, 0)), 0);
        empty.updateFade(150);

        const fresh = new VariableFxStackEntry('y');

        fresh.show(entry('y', new FakeVisualizer(10, 10)), 0);

        expect(layoutVariableFxStack([ empty, fresh ], 0, true).pieces).toHaveLength(0);
    });

    it('sorts by layer, then creation time, config id and variable', () =>
    {
        const make = (key: string, overrides: Partial<IRoomObjectVariableFxEntry>) =>
        {
            const fx = new VariableFxStackEntry(key);

            fx.show(entry(key, new FakeVisualizer(1, 1), overrides), 0);

            return fx;
        };

        const sorted = [
            make('d', { layer: 0, createdAt: 5, configId: 1, variableId: 'b' }),
            make('c', { layer: 0, createdAt: 5, configId: 1, variableId: 'a' }),
            make('b', { layer: 0, createdAt: 1, configId: 9 }),
            make('e', { layer: 1, createdAt: 0 }),
            make('a', { layer: -3, createdAt: 99 })
        ].sort(compareVariableFxStackEntries);

        expect(sorted.map(fx => fx.key)).toEqual([ 'a', 'b', 'c', 'd', 'e' ]);
    });
});

describe('VariableFxStack', () =>
{
    afterEach(() =>
    {
        vi.useRealTimers();
    });

    it('composes the visible entries onto the sprite above the anchor, in front of the holder', () =>
    {
        const stack = new TestStack();
        const sprite = new RoomObjectSprite();

        stack.setEntries([ entry('a', new FakeVisualizer(40, 10, 'a')), entry('b', new FakeVisualizer(20, 6, 'b')) ], 0);

        stack.apply(sprite, 5, -86, 0);
        expect(sprite.visible).toBe(false);

        stack.apply(sprite, 5, -86, 75);

        expect(sprite.visible).toBe(true);
        expect(sprite.offsetX).toBe(5 - 20);
        expect(sprite.offsetY).toBe(-86 - 20);
        expect(sprite.relativeDepth).toBe(-0.2);
        expect(stack.canvases[0]).toEqual(expect.objectContaining({ width: 40, height: 20 }));
        expect(stack.draws).toEqual([
            { name: 'a', x: 0, y: 10, alpha: 128 },
            { name: 'b', x: 10, y: 0, alpha: 128 }
        ]);

        stack.apply(sprite, 5, -86, 150);

        expect(stack.draws.map(draw => draw.alpha)).toEqual([ 255, 255 ]);
        expect(stack.isAnimating).toBe(false);
        expect(stack.visibleHeight).toBe(20);
    });

    it('keeps a gone fx on screen for its 350 ms fade-out, then drops it', () =>
    {
        const stack = new TestStack();
        const sprite = new RoomObjectSprite();
        const visualizer = new FakeVisualizer(30, 10, 'a');

        stack.setEntries([ entry('a', visualizer) ], 0);
        stack.apply(sprite, 0, -50, 150);

        stack.setEntries([], 1000);
        stack.apply(sprite, 0, -50, 1000);

        expect(sprite.visible).toBe(true);
        expect(stack.draws[0].alpha).toBe(255);

        stack.apply(sprite, 0, -50, 1175);

        expect(sprite.visible).toBe(true);
        expect(stack.draws[0].alpha).toBe(128);

        stack.apply(sprite, 0, -50, 1350);

        expect(sprite.visible).toBe(false);
        expect(stack.isEmpty).toBe(true);
        expect(stack.visibleHeight).toBe(0);
    });

    it('asks the visualizers for new frames and composes again', () =>
    {
        const stack = new TestStack();
        const sprite = new RoomObjectSprite();
        const visualizer = new FakeVisualizer(30, 10, 'a');

        stack.setEntries([ entry('a', visualizer) ], 0);
        stack.apply(sprite, 0, 0, 150);

        expect(stack.apply(sprite, 0, 0, 200)).toBe(false);

        visualizer.pending = 1;

        expect(stack.apply(sprite, 0, 0, 216)).toBe(true);
        expect(visualizer.updates).toBe(1);
    });

    it('only moves the sprite when the anchor moves and nothing else changed', () =>
    {
        const stack = new TestStack();
        const sprite = new RoomObjectSprite();

        stack.setEntries([ entry('a', new FakeVisualizer(30, 10)) ], 0);
        stack.apply(sprite, 0, 0, 150);

        expect(stack.apply(sprite, 0, 0, 200)).toBe(false);
        expect(stack.apply(sprite, 0, -45, 216)).toBe(true);
        expect(sprite.offsetY).toBe(-55);
    });

    it('ignores the same entries array and duplicate keys', () =>
    {
        const stack = new TestStack();
        const entries = [ entry('a', new FakeVisualizer(30, 10)), entry('a', new FakeVisualizer(10, 10)) ];

        expect(stack.setEntries(entries, 0)).toBe(true);
        expect(stack.setEntries(entries, 10)).toBe(false);
        expect(stack.entries).toHaveLength(1);
    });

    it('swaps a re-sized canvas and destroys the old texture on the next apply', () =>
    {
        const stack = new TestStack();
        const sprite = new RoomObjectSprite();

        stack.setEntries([ entry('a', new FakeVisualizer(30, 10)) ], 0);
        stack.apply(sprite, 0, 0, 150);
        stack.setEntries([ entry('a', new FakeVisualizer(30, 10)), entry('b', new FakeVisualizer(30, 10)) ], 200);
        stack.apply(sprite, 0, 0, 400);

        expect(stack.textures).toHaveLength(2);
        expect(stack.textures[0].destroyed).toBe(false);

        stack.apply(sprite, 0, 0, 416);

        expect(stack.textures[0].destroyed).toBe(true);

        stack.dispose();

        expect(stack.textures[1].destroyed).toBe(true);
    });
});
