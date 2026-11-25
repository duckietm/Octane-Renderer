import { IFurnitureData } from '@octane/api';
import { GetConfiguration } from '@octane/configuration';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const setValue = vi.fn();
const loadGamedata = vi.fn();

vi.mock('@octane/localization', async importOriginal => ({
    ...(await importOriginal<object>()),
    GetLocalizationManager: () => ({ setValue })
}));

vi.mock('@octane/utils', async importOriginal => ({
    ...(await importOriginal<object>()),
    loadGamedata: (url: string) => loadGamedata(url)
}));

const { FurnitureDataLoader } = await import('../furniture/FurnitureDataLoader');
const { SessionDataManager } = await import('../SessionDataManager');

const FURNIDATA = {
    roomitemtypes: { furnitype: [ { id: 10, classname: 'chair*3', name: 'Chair', description: 'Sit', partcolors: { color: [ '#ff0000', '00ff00' ] } } ] },
    wallitemtypes: { furnitype: [ { id: 20, classname: 'poster', name: 'Poster', description: 'Hang' } ] }
};

beforeEach(() =>
{
    setValue.mockReset();
    loadGamedata.mockReset();
    loadGamedata.mockResolvedValue(FURNIDATA);
    GetConfiguration().setValue('furnidata.url', 'https://cdn.example/furnidata.json');
});

const createLoader = () =>
{
    const floorItems = new Map<number, IFurnitureData>();
    const wallItems = new Map<number, IFurnitureData>();

    return { loader: new FurnitureDataLoader(floorItems, wallItems), floorItems, wallItems };
};

describe('FurnitureDataLoader localization', () =>
{
    it('copies every name and description into the localization by default', async () =>
    {
        const { loader, floorItems } = createLoader();

        await loader.init();

        expect(setValue).toHaveBeenCalledWith('roomItem.name.10', 'Chair');
        expect(setValue).toHaveBeenCalledWith('wallItem.desc.20', 'Hang');
        expect(floorItems.get(10)).toMatchObject({ className: 'chair', hasIndexedColor: true, colorIndex: 3, colors: [ 0xff0000, 0x00ff00 ] });
    });

    it('copies nothing when the localization reads the furniture data itself', async () =>
    {
        const { loader, floorItems, wallItems } = createLoader();

        await loader.init(true);
        await loader.mergeFromUrl('https://cdn.example/custom.json', false);

        expect(setValue).not.toHaveBeenCalled();
        expect(floorItems.get(10)?.name).toBe('Chair');
        expect(wallItems.get(20)?.description).toBe('Hang');
    });
});

describe('SessionDataManager furniture texts', () =>
{
    const manager = async (floorOverrides: [string, Partial<IFurnitureData>][] = []) =>
    {
        const { loader, floorItems, wallItems } = createLoader();
        const instance = Object.create(SessionDataManager.prototype) as InstanceType<typeof SessionDataManager>;

        await loader.init(true);
        Object.assign(instance, { _floorItems: floorItems, _wallItems: wallItems, _floorItemOverrides: new Map(floorOverrides), _wallItemOverrides: new Map() });

        const resolve = (key: string) => (instance as unknown as { resolveFurnitureLocalization(key: string): string | null }).resolveFurnitureLocalization(key);

        return { instance, resolve };
    };

    it('answers the four furniture keys from the furniture data', async () =>
    {
        const { resolve } = await manager();

        expect(resolve('roomItem.name.10')).toBe('Chair');
        expect(resolve('roomItem.desc.10')).toBe('Sit');
        expect(resolve('wallItem.name.20')).toBe('Poster');
        expect(resolve('wallItem.desc.20')).toBe('Hang');
    });

    it('answers nothing for other keys or unknown items', async () =>
    {
        const { resolve } = await manager();

        expect(resolve('roomItem.name.20')).toBeNull();
        expect(resolve('roomItem.name.')).toBeNull();
        expect(resolve('roomItem.name.abc')).toBeNull();
        expect(resolve('roomItem.other.10')).toBeNull();
        expect(resolve('catalog.title')).toBeNull();
    });

    it('applies the furniture translation overrides', async () =>
    {
        const { resolve } = await manager([ [ 'chair', { name: 'Stuhl', description: 'Sitzen' } ] ]);

        expect(resolve('roomItem.name.10')).toBe('Stuhl');
        expect(resolve('roomItem.desc.10')).toBe('Sitzen');
    });

    it('lists the furniture data as it is when no override applies', async () =>
    {
        const { instance } = await manager();

        expect(instance.getAllFurnitureData().map(item => item.id)).toEqual([ 10, 20 ]);
    });
});
