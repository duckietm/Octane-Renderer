import { RoomObjectVariable } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { ObjectAdUpdateMessage } from '../../../messages';
import { FurnitureRoomBrandingLogic } from './FurnitureRoomBrandingLogic';

const downloads = new Map<string, { resolve: (ok: boolean) => void; reject: (error: Error) => void }>();

vi.mock('@octane/assets', () => ({
    GetAssetManager: () => ({
        getTexture: () => null,
        downloadAsset: (url: string) => new Promise<boolean>((resolve, reject) => downloads.set(url, { resolve, reject }))
    })
}));

vi.mock('@octane/configuration', () => ({
    GetConfiguration: () => ({ getValue: () => [] })
}));

const brandingWithModel = () =>
{
    const values = new Map<string, unknown>();
    const logic = new FurnitureRoomBrandingLogic();
    const seen: string[] = [];

    (logic as unknown as { _object: unknown })._object = {
        model: {
            getValue: (key: string) => values.get(key),
            setValue: (key: string, value: unknown) => values.set(key, value)
        }
    };
    vi.spyOn(logic, 'processUpdateMessage').mockImplementation((message: ObjectAdUpdateMessage) => seen.push(message.type));

    const show = (url: string) =>
    {
        values.set(RoomObjectVariable.FURNITURE_BRANDING_IMAGE_URL, url);
        values.set(RoomObjectVariable.FURNITURE_BRANDING_IMAGE_STATUS, 0);

        return (logic as unknown as { downloadBackground: () => Promise<void> }).downloadBackground();
    };

    return { show, seen };
};

describe('FurnitureRoomBrandingLogic downloads', () =>
{
    it('ignores a slower download of an address the owner already replaced', async () =>
    {
        const { show, seen } = brandingWithModel();
        const first = show('https://cdn.example/a.png');
        const second = show('https://cdn.example/b.png');

        downloads.get('https://cdn.example/b.png').resolve(true);
        await second;
        // The old address failing late used to mark the new, loaded image as failed.
        downloads.get('https://cdn.example/a.png').reject(new Error('timeout'));
        await first;

        expect(seen).toEqual([ ObjectAdUpdateMessage.IMAGE_LOADED ]);
    });

    it('reports the address still shown', async () =>
    {
        const { show, seen } = brandingWithModel();
        const only = show('https://cdn.example/c.png');

        downloads.get('https://cdn.example/c.png').reject(new Error('404'));
        await only;

        expect(seen).toEqual([ ObjectAdUpdateMessage.IMAGE_LOADING_FAILED ]);
    });
});

describe('FurnitureRoomBrandingLogic.secureImageUrl', () =>
{
    it('upgrades an http address on an https page', () =>
    {
        expect(FurnitureRoomBrandingLogic.secureImageUrl('http://cdn.example/a.png', 'https:')).toBe('https://cdn.example/a.png');
        expect(FurnitureRoomBrandingLogic.secureImageUrl('HTTP://cdn.example/a.png', 'https:')).toBe('https://cdn.example/a.png');
    });

    it('keeps the address on an http page, and an https or relative one anywhere', () =>
    {
        expect(FurnitureRoomBrandingLogic.secureImageUrl('http://localhost/a.png', 'http:')).toBe('http://localhost/a.png');
        expect(FurnitureRoomBrandingLogic.secureImageUrl('https://cdn.example/a.png', 'https:')).toBe('https://cdn.example/a.png');
        expect(FurnitureRoomBrandingLogic.secureImageUrl('/images/a.png', 'https:')).toBe('/images/a.png');
        expect(FurnitureRoomBrandingLogic.secureImageUrl('', 'https:')).toBe('');
    });

    it('only touches the scheme at the start', () =>
    {
        expect(FurnitureRoomBrandingLogic.secureImageUrl('https://proxy.example/?u=http://x/a.png', 'https:')).toBe('https://proxy.example/?u=http://x/a.png');
    });
});
