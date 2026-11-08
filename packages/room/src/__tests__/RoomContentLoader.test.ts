import { FurnitureType, RoomObjectCategory } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { buildContentImageKey, RoomContentLoader } from '../RoomContentLoader';

describe('RoomContentLoader', () =>
{
    it('categorizes indexed-color wall item object names as wall furni', () =>
    {
        const loader = new RoomContentLoader();

        loader.processFurnitureData([
            {
                type: FurnitureType.WALL,
                id: 7,
                className: 'wall_flag*2',
                revision: 1
            } as any
        ]);

        expect(loader.getFurnitureWallNameForTypeId(7)).toBe('wall_flag');
        expect(loader.getCategoryForType('wall_flag')).toBe(RoomObjectCategory.WALL);
    });

    it('prefers wall category when furnidata has duplicate floor and wall class names', () =>
    {
        const loader = new RoomContentLoader();

        loader.processFurnitureData([
            {
                type: FurnitureType.FLOOR,
                id: 21210509,
                className: 'diamond_painting14',
                revision: 59005
            } as any,
            {
                type: FurnitureType.WALL,
                id: 4608,
                className: 'diamond_painting14',
                revision: 58643
            } as any
        ]);

        expect(loader.getFurnitureWallNameForTypeId(4608)).toBe('diamond_painting14');
        expect(loader.getCategoryForType('diamond_painting14')).toBe(RoomObjectCategory.WALL);
    });

    it('caches and announces an icon under the name the engine looks it up by', () =>
    {
        const images: any[] = [];
        const loaded = vi.fn();

        vi.stubGlobal('Image', class
        {
            public src = '';
            public onload: () => void = null;
            public onerror: () => void = null;

            constructor()
            {
                images.push(this);
            }
        });

        try
        {
            const loader = new RoomContentLoader();

            loader.setIconListener({ onRoomContentLoaded: loaded });
            vi.spyOn(loader, 'getAssetUrls').mockReturnValue([ 'icon.png' ]);

            loader.downloadImage(1, 'chair,2', '0');
            images[0].onload();

            const name = buildContentImageKey('chair,2', '0');

            expect(loaded).toHaveBeenCalledWith(1, name, true);
            expect(loader.getImage(name)).not.toBeNull();
        }
        finally
        {
            vi.unstubAllGlobals();
        }
    });
});
