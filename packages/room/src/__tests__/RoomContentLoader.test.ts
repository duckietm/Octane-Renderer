import { FurnitureType, RoomObjectCategory } from '@nitrots/api';
import { describe, expect, it } from 'vitest';
import { RoomContentLoader } from '../RoomContentLoader';

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
});
