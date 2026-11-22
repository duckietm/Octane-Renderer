import { IMessageDataWrapper } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { RecolorFurniUpdateParser } from '../RecolorFurniUpdateParser';

const wrapperOf = (values: number[]): IMessageDataWrapper =>
{
    const queue = [ ...values ];

    return {
        readInt: () => queue.shift(),
        readShort: () => queue.shift(),
        get bytesAvailable()
        {
            return queue.length > 0;
        }
    } as unknown as IMessageDataWrapper;
};

describe('RecolorFurniUpdateParser', () =>
{
    it('reads each group of furni ids with its colour', () =>
    {
        const parser = new RecolorFurniUpdateParser();

        parser.flush();
        expect(parser.parse(wrapperOf([ 2, 2, 7, 9, 255, 128, 0, 1, 12, 0, 16, 255 ]))).toBe(true);

        expect(parser.updates).toEqual([
            { furniIds: [ 7, 9 ], red: 255, green: 128, blue: 0 },
            { furniIds: [ 12 ], red: 0, green: 16, blue: 255 }
        ]);
    });
});
