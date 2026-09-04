import { describe, expect, it, vi } from 'vitest';
import { ImageLoaderDependencies, loadImageResource } from './ImageLoader';

const animatedWebP = (): Uint8Array => new Uint8Array([
    0x52, 0x49, 0x46, 0x46, 20, 0, 0, 0,
    0x57, 0x45, 0x42, 0x50,
    0x56, 0x50, 0x38, 0x58, 0, 0, 0, 0,
    0x41, 0x4e, 0x49, 0x4d
]);

const createDependencies = (overrides: Partial<ImageLoaderDependencies> = {}): ImageLoaderDependencies => (({
    fetch: vi.fn(),
    decodeStatic: vi.fn().mockResolvedValue({ kind: 'static' }),
    decodeGif: vi.fn().mockReturnValue({ kind: 'gif' }),
    decodeApng: vi.fn().mockResolvedValue({ kind: 'apng' }),
    decodeAnimatedWebP: vi.fn().mockResolvedValue({ kind: 'animated-webp' }),
    warn: vi.fn(),
    ...overrides
}));

describe('loadImageResource', () =>
{
    it('trusts animated WebP bytes over a misleading PNG source and MIME type', async () =>
    {
        const dependencies = createDependencies();
        const resource = await loadImageResource({
            source: 'https://cdn.example/effect.PNG?v=2',
            bytes: animatedWebP(),
            contentType: 'image/png'
        }, dependencies);

        expect(dependencies.decodeAnimatedWebP).toHaveBeenCalledOnce();
        expect(dependencies.decodeStatic).not.toHaveBeenCalled();
        expect(resource).toEqual({ kind: 'animated-webp' });
    });

    it('uses the response MIME for an extensionless fetched AVIF image', async () =>
    {
        const dependencies = createDependencies({
            fetch: vi.fn().mockResolvedValue({
                ok: true,
                status: 200,
                headers: { get: vi.fn().mockReturnValue('image/avif') },
                arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(0))
            })
        });

        await loadImageResource({ source: 'https://cdn.example/image/42' }, dependencies);

        expect(dependencies.decodeStatic).toHaveBeenCalledWith(expect.any(Uint8Array), 'avif', 'https://cdn.example/image/42');
    });

    it('rejects animated spritesheet payloads with a stable-atlas explanation', async () =>
    {
        const dependencies = createDependencies();

        await expect(loadImageResource({
            source: 'atlas.webp',
            bytes: animatedWebP(),
            allowAnimation: false
        }, dependencies)).rejects.toThrow(/stable atlas/i);
    });

    it('distinguishes HTTP failures from decoder failures', async () =>
    {
        const dependencies = createDependencies({
            fetch: vi.fn().mockResolvedValue({ ok: false, status: 404 })
        });

        await expect(loadImageResource({ source: '/missing.webp' }, dependencies)).rejects.toThrow(/HTTP 404/);
    });

    it('falls back to a safe static frame and warns when animated decoding fails', async () =>
    {
        const dependencies = createDependencies({
            decodeAnimatedWebP: vi.fn().mockRejectedValue(new Error('animation decoder failed')),
            decodeStatic: vi.fn().mockResolvedValue({ kind: 'first-frame' })
        });

        const resource = await loadImageResource({ source: 'effect.webp', bytes: animatedWebP() }, dependencies);

        expect(resource).toEqual({ kind: 'first-frame' });
        expect(dependencies.warn).toHaveBeenCalledWith(expect.stringMatching(/animation decoder failed/));
    });

    it('rejects an unknown payload instead of returning a broken texture', async () =>
    {
        await expect(loadImageResource({
            source: 'asset.bin',
            bytes: new Uint8Array([ 1, 2, 3 ]),
            contentType: 'application/octet-stream'
        }, createDependencies())).rejects.toThrow(/unsupported image format/i);
    });
});
