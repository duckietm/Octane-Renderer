import { AvatarAction, IRoomObjectSprite, IRoomObjectVariableFxEntry, IRoomObjectVariableFxVisualizer } from '@octane/api';
import { Texture } from 'pixi.js';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { HabbiconBubbleAddition } from '../avatar/additions/HabbiconBubbleAddition';
import { HabbiconStackVisualizer, IHabbiconStackSource } from '../avatar/additions/HabbiconStackVisualizer';
import { VariableFxStackAddition } from '../avatar/additions/VariableFxStackAddition';
import { AvatarVisualization } from '../avatar/AvatarVisualization';
import { RoomObjectSprite } from '../RoomObjectSprite';
import { VariableFxBitmap, VariableFxBlendMode } from './rendering/VariableFxBitmap';
import { layoutVariableFxStack, VariableFxStack } from './VariableFxStack';
import { IVariableFxStackedAdditionVisualizer } from './VariableFxStackEntry';

const fxVisualizer = (width: number, height: number): IRoomObjectVariableFxVisualizer => ({
    frame: { source: {} as CanvasImageSource, width, height, anchorX: 0, anchorY: 0, updateId: 1 },
    needsUpdate: () => false,
    update: () => false
});

const fx = (key: string, height = 10): IRoomObjectVariableFxEntry => ({ key, layer: 0, createdAt: 0, configId: 1, variableId: key, visible: true, visualizer: fxVisualizer(30, height) });

const habbicon = (width = 54, height = 54): IVariableFxStackedAdditionVisualizer & { isFinished: boolean } =>
{
    const visualizer = {
        isFinished: false,
        frame: { source: {} as CanvasImageSource, width, height, anchorX: (-27 + 27), anchorY: 0, updateId: 1 },
        needsUpdate: () => !visualizer.isFinished,
        update: () => false
    };

    return visualizer;
};

const fakeTexture = () => ({ width: 1, height: 1, destroyed: false, source: { update: () => undefined }, destroy()
{
    this.destroyed = true;
} }) as unknown as Texture;

describe('the habbicon in the stacked additions (AIR layer 100)', () =>
{
    beforeEach(() =>
    {
        const context = { globalAlpha: 1, setTransform: () => undefined, clearRect: () => undefined, drawImage: () => undefined };

        vi.spyOn(VariableFxStack.prototype as unknown as { createCanvas: () => unknown }, 'createCanvas').mockImplementation((...args: unknown[]) => ({ width: args[0], height: args[1], getContext: () => context }));
        vi.spyOn(VariableFxStack.prototype as unknown as { createTexture: () => unknown }, 'createTexture').mockImplementation(() => fakeTexture());
    });

    afterEach(() => vi.restoreAllMocks());

    it('sits above every fx, 4 px over the topmost one, and stays when the fx go', () =>
    {
        const stack = new VariableFxStack();
        const icon = habbicon();

        stack.setEntries([ fx('a', 10), fx('b', 13) ], 0);
        stack.setAddition(VariableFxStackAddition.HABBICON_KEY, VariableFxStackAddition.LAYER_HABBICON, icon, 0);
        stack.apply(new RoomObjectSprite(), 0, -86, 0);
        stack.apply(new RoomObjectSprite(), 0, -86, 1000);

        const keys = stack.entries.map(entry => entry.key);
        const layout = layoutVariableFxStack([ ...stack.entries ], 1000, false);
        const top = layout.pieces.find(piece => piece.entry.key === 'habbicon');

        expect(keys[keys.length - 1]).toBe('habbicon');
        // Bottom up: 10 px fx at 0, 13 px fx at -14, the habbicon's bottom at -14 - 13 - 4; it was
        // alone while the fx faded in, so it slides up there with the stack motion.
        expect(top.entry.y.target).toBe(-31);
        expect(top.alpha).toBe(255);

        stack.setEntries([], 1000);

        expect(stack.entries.find(entry => entry.key === 'habbicon').takesSlot).toBe(true);
        expect(stack.hasClientEntries).toBe(true);

        stack.apply(new RoomObjectSprite(), 0, -86, 2000);

        expect(stack.hasClientEntries).toBe(false);
        expect(stack.entries.map(entry => entry.key)).toEqual([ 'habbicon' ]);

        icon.isFinished = true;
        stack.apply(new RoomObjectSprite(), 0, -86, 2100);

        expect(stack.isEmpty).toBe(true);
    });

    it('takes the bubble bitmap with its own x and the intro slide as its y', () =>
    {
        const texture = { width: 54, height: 54, destroyed: false, source: { resource: {} as CanvasImageSource } } as unknown as Texture;
        const source: Omit<IHabbiconStackSource, 'isFinished'> & { calls: string[], isFinished: boolean } = {
            calls: [],
            isFinished: false,
            isPartOfStack: false,
            update(sprite: IRoomObjectSprite, scale: number)
            {
                this.calls.push(`update:${ scale }`);
            },
            animate(sprite: IRoomObjectSprite)
            {
                this.calls.push('animate');
                sprite.texture = texture;
                sprite.visible = true;
                sprite.offsetX = -27;
                sprite.offsetY = 12;

                return true;
            },
            dispose()
            {}
        };
        const visualizer = new HabbiconStackVisualizer(source, () => 64);

        expect(source.isPartOfStack).toBe(true);
        expect(visualizer.update(0)).toBe(true);
        expect(visualizer.frame).toMatchObject({ width: 54, height: 54, anchorX: 0, anchorY: 12 });
        expect(visualizer.update(10)).toBe(false);
        expect(source.calls).toEqual([ 'update:64', 'animate', 'animate' ]);

        source.isFinished = true;

        expect(visualizer.isFinished).toBe(true);
        expect(visualizer.update(20)).toBe(true);
        expect(visualizer.frame).toBeNull();
    });

    it('moves the bubble by the intro slide only once it is part of the stack', () =>
    {
        const holder = { posture: AvatarAction.POSTURE_SIT, habbiconFacingDirection: 0 } as unknown as AvatarVisualization;
        const standalone = new HabbiconBubbleAddition(8, 1, 1, holder);
        const stacked = new HabbiconBubbleAddition(8, 1, 1, holder);
        const first = new RoomObjectSprite();
        const second = new RoomObjectSprite();

        stacked.isPartOfStack = true;
        standalone.update(first, 64);
        stacked.update(second, 64);

        expect(second.offsetY).toBe(12);
        // On its own it starts from the stack bottom, lowered for sitting.
        expect(first.offsetY).toBe(-86 + 32 + 12);
        expect(stacked.isFinished).toBe(false);
    });

    it('puts the habbicon on the avatar stack addition and replaces it', () =>
    {
        const addition = new VariableFxStackAddition(9, { posture: AvatarAction.POSTURE_STAND });
        const first: IHabbiconStackSource = { isFinished: false, isPartOfStack: false, update: () => undefined, animate: () => false, dispose: vi.fn() };
        const second: IHabbiconStackSource = { isFinished: false, isPartOfStack: false, update: () => undefined, animate: () => false, dispose: vi.fn() };

        expect(addition.setHabbicon(first, 0)).toBe(true);
        expect(addition.setHabbicon(first, 0)).toBe(false);
        expect(addition.stack.entries[0].layer).toBe(100);

        addition.setHabbicon(second, 10);

        expect(first.dispose).toHaveBeenCalled();
        expect(addition.habbicon).toBe(second);
        expect(addition.stack.entries).toHaveLength(1);

        addition.setHabbicon(null, 20);

        expect(addition.stack.isEmpty).toBe(true);
    });
});

describe('VariableFxBitmap on a canvas', () =>
{
    const createContext = (log: string[]) =>
    {
        const context: Record<string, unknown> = {
            globalAlpha: 1,
            globalCompositeOperation: 'source-over',
            save: () => log.push('save'),
            restore: () => log.push('restore'),
            beginPath: () => undefined,
            rect: (x: number, y: number, width: number, height: number) => log.push(`rect ${ x },${ y },${ width },${ height }`),
            clip: () => log.push('clip'),
            setTransform: (a: number, b: number, c: number, d: number, e: number, f: number) => log.push(`transform ${ a },${ e },${ f }`),
            clearRect: () => log.push('clearRect'),
            fillRect: () => log.push(`fill ${ String(context.fillStyle) } ${ String(context.globalCompositeOperation) }`),
            drawImage: () => log.push(`draw ${ String(context.globalCompositeOperation) } ${ String(context.globalAlpha) }`)
        };

        return context;
    };

    let original: typeof VariableFxBitmap.createCanvas;

    beforeEach(() => original = VariableFxBitmap.createCanvas);
    afterEach(() => VariableFxBitmap.createCanvas = original);

    it('draws blends as canvas composites inside the clip and tints like AIR (multiply, then the alpha put back)', () =>
    {
        const logs: string[][] = [];

        VariableFxBitmap.createCanvas = (width, height) =>
        {
            const log: string[] = [];
            const context = createContext(log);

            logs.push(log);

            return { width, height, getContext: () => context } as unknown as HTMLCanvasElement;
        };

        const bitmap = new VariableFxBitmap(20, 10);
        const image = { width: 8, height: 7, source: {} as CanvasImageSource };

        bitmap.draw(image, 1, 3, 2, null, VariableFxBlendMode.ADD, { x: 3, y: 2, width: 5, height: 7 });

        expect(logs[0]).toEqual([ 'save', 'transform 1,0,0', 'rect 3,2,5,7', 'clip', 'transform 1,3,2', 'draw lighter 1', 'restore' ]);

        bitmap.draw(image, 1, 0, 0, { red: 1, green: 0.5, blue: 0, alpha: 1 }, VariableFxBlendMode.MULTIPLY, null);

        expect(logs[1]).toEqual([ 'clearRect', 'draw source-over 1', 'fill rgb(255, 128, 0) multiply', 'draw destination-in 1' ]);
        expect(logs[0].slice(-2)).toEqual([ 'draw multiply 1', 'restore' ]);
    });
});
