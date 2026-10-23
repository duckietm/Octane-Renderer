import { describe, expect, it } from 'vitest';
import { BinaryReader } from '../BinaryReader';
import { BinaryWriter } from '../BinaryWriter';

describe('BinaryWriter', () =>
{
    it('returns exactly the bytes written, however far it had to grow', () =>
    {
        const writer = new BinaryWriter();
        const expected: number[] = [];

        for(let i = 0; i < 5000; i++)
        {
            writer.writeInt(i * 7919);

            expected.push((i * 7919) >> 24 & 0xFF, (i * 7919) >> 16 & 0xFF, (i * 7919) >> 8 & 0xFF, (i * 7919) & 0xFF);
        }

        const buffer = writer.getBuffer();

        expect(buffer.byteLength).toBe(expected.length);
        expect(Array.from(new Uint8Array(buffer))).toEqual(expected);
    });

    it('keeps writing after the buffer was read', () =>
    {
        const writer = new BinaryWriter();

        writer.writeShort(1);

        expect(writer.getBuffer().byteLength).toBe(2);

        writer.writeString('héllo');

        const reader = new BinaryReader(writer.getBuffer());

        expect(reader.readShort()).toBe(1);
        expect(reader.readShort()).toBe(6);
        expect(reader.readBytes(6).toString()).toBe('héllo');
        expect(reader.remaining()).toBe(0);
    });

    it('hands out a copy, so later writes do not change a buffer already taken', () =>
    {
        const writer = new BinaryWriter();

        writer.writeByte(1);

        const first = new Uint8Array(writer.getBuffer());

        writer.writeByte(2);

        expect(Array.from(first)).toEqual([ 1 ]);
        expect(writer.getBuffer().byteLength).toBe(2);
    });

    it('an empty writer yields an empty buffer', () =>
    {
        expect(new BinaryWriter().getBuffer().byteLength).toBe(0);
    });
});
