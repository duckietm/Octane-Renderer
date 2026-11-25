import { beforeEach, describe, expect, it, vi } from 'vitest';

const pixi = vi.hoisted(() => ({
    initOptions: [] as unknown[],
    failInit: false,
    destroyed: 0,
    autoDetect: [] as unknown[]
}));

const fakeRenderer = () => ({ render: () => undefined, resize: () => undefined, events: { destroy: () => undefined } });

vi.mock('pixi.js', async importOriginal => ({
    ...(await importOriginal<object>()),
    WebGLRenderer: class
    {
        public render = () => undefined;
        public resize = () => undefined;
        public events = { destroy: () => undefined };

        public async init(options: unknown): Promise<void>
        {
            pixi.initOptions.push(options);

            if(pixi.failInit) throw new Error('no WebGL');
        }

        public destroy(): void
        {
            pixi.destroyed++;
        }
    },
    autoDetectRenderer: async (options: unknown) =>
    {
        pixi.autoDetect.push(options);

        return fakeRenderer();
    }
}));

const { PrepareRenderer } = await import('../GetRenderer');

beforeEach(() =>
{
    pixi.initOptions = [];
    pixi.failInit = false;
    pixi.destroyed = 0;
    pixi.autoDetect = [];
});

describe('PrepareRenderer', () =>
{
    it('makes a WebGL renderer directly for a webgl preference, with the webgl options merged in', async () =>
    {
        await PrepareRenderer({ preference: 'webgl', width: 10, webgl: { antialias: true }, webgpu: {} });

        expect(pixi.autoDetect).toHaveLength(0);
        expect(pixi.initOptions).toEqual([ { preference: 'webgl', width: 10, antialias: true } ]);
    });

    it('falls back to Pixi\'s detection when WebGL fails to start', async () =>
    {
        pixi.failInit = true;

        await PrepareRenderer({ preference: 'webgl', width: 10 });

        expect(pixi.destroyed).toBe(1);
        expect(pixi.autoDetect).toEqual([ { preference: 'webgl', width: 10 } ]);
    });

    it('leaves any other preference to Pixi\'s detection', async () =>
    {
        await PrepareRenderer({ preference: 'webgpu', width: 10 });

        expect(pixi.initOptions).toHaveLength(0);
        expect(pixi.autoDetect).toHaveLength(1);
    });
});
