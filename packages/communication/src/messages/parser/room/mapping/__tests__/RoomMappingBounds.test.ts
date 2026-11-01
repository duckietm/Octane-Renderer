import { IMessageDataWrapper } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { FloorHeightMapMessageParser } from '../FloorHeightMapMessageParser';
import { RoomHeightMapParser } from '../RoomHeightMapParser';
import { RoomHeightMapUpdateParser } from '../RoomHeightMapUpdateParser';

/** A wrapper that hands out the given values in order, whatever the read. */
const wrapperOf = (...values: number[]): IMessageDataWrapper =>
{
    const read = () => values.shift();

    return { readInt: read, readShort: read, readByte: read } as unknown as IMessageDataWrapper;
};

describe('room mapping parsers with bad sizes', () =>
{
    it('refuses a height map of width 0 instead of computing an infinite height', () =>
    {
        const parser = new RoomHeightMapParser();

        expect(parser.parse(wrapperOf(0, 10))).toBe(false);
        expect(parser.height).toBe(0);
    });

    it('refuses a tile count that is not whole rows of the width', () =>
    {
        expect(new RoomHeightMapParser().parse(wrapperOf(3, 10))).toBe(false);
    });

    it('reads a well formed height map', () =>
    {
        const parser = new RoomHeightMapParser();
        parser.flush();

        expect(parser.parse(wrapperOf(2, 4, 1, 2, 3, 4))).toBe(true);
        expect(parser.height).toBe(2);
    });

    it('reads update coordinates past 127 as the unsigned bytes the server writes', () =>
    {
        const parser = new RoomHeightMapUpdateParser();
        parser.parse(wrapperOf(1, -56, -1, 0));

        expect(parser.next()).toBe(true);
        expect(parser.x).toBe(200);
        expect(parser.y).toBe(255);
    });

    it('refuses a floor plan longer than the largest side it accepts', () =>
    {
        const parser = new FloorHeightMapMessageParser();
        const row = '0'.repeat(FloorHeightMapMessageParser.MAX_SIDE + 1);

        expect(parser.parseModel(row, 0)).toBe(false);
        expect(parser.width).toBe(0);
        expect(parser.parseModel('00\r00', 0)).toBe(true);
    });
});
