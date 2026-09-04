import { describe, expect, it } from 'vitest';
import { RecyclerPrizesMessageParser } from './RecyclerPrizesMessageParser';

const wrapper = (values: unknown[]) => ({
    readInt: () => values.shift() as number,
    readString: () => values.shift() as string
});

describe('RecyclerPrizesMessageParser', () =>
{
    it('parses ordered prize levels and products', () =>
    {
        const parser = new RecyclerPrizesMessageParser();

        expect(parser.parse(wrapper([1, 4, 25, 1, 'eco_lamp', 1, 's', 300]) as any)).toBe(true);
        expect(parser.levels).toEqual([
            {
                chance: 25,
                levelId: 4,
                products: [{ count: 1, name: 'eco_lamp', productClassId: 300, productType: 's' }]
            }
        ]);
    });

    it('rejects impossible collection sizes before allocating', () =>
    {
        const parser = new RecyclerPrizesMessageParser();

        expect(parser.parse(wrapper([51]) as any)).toBe(false);
        expect(parser.levels).toEqual([]);
    });
});
