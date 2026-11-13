import { IMessageDataWrapper } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { FurnitureFloorRemoveParser } from '../floor/FurnitureFloorRemoveParser';
import { ObjectRemoveMultipleParser } from '../floor/ObjectRemoveMultipleParser';
import { FurnitureWallRemoveParser } from '../wall/FurnitureWallRemoveParser';
import { ItemRemoveMultipleParser } from '../wall/ItemRemoveMultipleParser';

const wrapperOf = (values: (number | string | boolean)[]): IMessageDataWrapper =>
{
    const queue = [ ...values ];

    return {
        readInt: () => queue.shift(),
        readString: () => queue.shift(),
        readBoolean: () => queue.shift(),
        get bytesAvailable()
        {
            return queue.length > 0;
        }
    } as unknown as IMessageDataWrapper;
};

describe('remove packets: AIR trailing byInvisibleFurniManager', () =>
{
    it('reads the flag after ObjectRemove', () =>
    {
        const parser = new FurnitureFloorRemoveParser();

        expect(parser.parse(wrapperOf([ '12', false, 5, 0, true ]))).toBe(true);
        expect(parser.itemId).toBe(12);
        expect(parser.delay).toBe(0);
        expect(parser.byInvisibleFurniManager).toBe(true);
    });

    it('reads the flag after ItemRemove', () =>
    {
        const parser = new FurnitureWallRemoveParser();

        expect(parser.parse(wrapperOf([ '-4', 9, true ]))).toBe(true);
        expect(parser.userId).toBe(9);
        expect(parser.byInvisibleFurniManager).toBe(true);
    });

    it('reads the flag after both Multiple variants', () =>
    {
        const floor = new ObjectRemoveMultipleParser();
        const wall = new ItemRemoveMultipleParser();

        floor.parse(wrapperOf([ 2, 1, 2, 7, true ]));
        wall.parse(wrapperOf([ 1, 3, 7, true ]));

        expect(floor.ids).toEqual([ 1, 2 ]);
        expect(floor.pickerId).toBe(7);
        expect(floor.byInvisibleFurniManager).toBe(true);
        expect(wall.itemIds).toEqual([ 3 ]);
        expect(wall.byInvisibleFurniManager).toBe(true);
    });

    it('defaults to false when a server does not send it', () =>
    {
        const floor = new FurnitureFloorRemoveParser();
        const wall = new FurnitureWallRemoveParser();
        const floorMultiple = new ObjectRemoveMultipleParser();
        const wallMultiple = new ItemRemoveMultipleParser();

        floor.flush();
        wall.flush();
        floorMultiple.flush();
        wallMultiple.flush();

        expect(floor.parse(wrapperOf([ '12', false, 5, 0 ]))).toBe(true);
        expect(wall.parse(wrapperOf([ '3', 9 ]))).toBe(true);
        expect(floorMultiple.parse(wrapperOf([ 0, 7 ]))).toBe(true);
        expect(wallMultiple.parse(wrapperOf([ 0, 7 ]))).toBe(true);

        expect(floor.byInvisibleFurniManager).toBe(false);
        expect(wall.byInvisibleFurniManager).toBe(false);
        expect(floorMultiple.byInvisibleFurniManager).toBe(false);
        expect(wallMultiple.byInvisibleFurniManager).toBe(false);
    });
});
