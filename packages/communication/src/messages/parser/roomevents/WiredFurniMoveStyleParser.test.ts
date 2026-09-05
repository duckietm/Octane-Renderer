import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WiredFurniMoveStyleParser } from './WiredFurniMoveStyleParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readByte()
    {
        return this.reader.readByte();
    }
    readBoolean()
    {
        return this.reader.readByte() === 1;
    }
    readShort()
    {
        return this.reader.readShort();
    }
    readInt()
    {
        return this.reader.readInt();
    }
    readString()
    {
        const length = this.reader.readShort(); return this.reader.readBytes(length).toString();
    }
    header = 0;
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
    get remainingBytes()
    {
        return this.reader.remaining();
    }
}

const wrapper = (writer: BinaryWriter) => new TestWrapper(new BinaryReader(writer.getBuffer())) as any;

describe('WiredFurniMoveStyleParser', () =>
{
    it('parses and clamps a valid style hint', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(2); writer.writeInt(42); writer.writeInt(43); writer.writeInt(9); writer.writeInt(250);
        const parser = new WiredFurniMoveStyleParser();

        expect(parser.parse(wrapper(writer))).toBe(true);
        expect(parser.itemIds).toEqual([ 42, 43 ]);
        expect(parser.style).toBe(6);
        expect(parser.intensity).toBe(100);
    });

    it('rejects oversized counts before looping', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1001);
        expect(new WiredFurniMoveStyleParser().parse(wrapper(writer))).toBe(false);
    });

    it('rejects non-positive item ids and truncated payloads', () =>
    {
        const invalidId = new BinaryWriter();
        invalidId.writeInt(1); invalidId.writeInt(0); invalidId.writeInt(6); invalidId.writeInt(100);
        expect(new WiredFurniMoveStyleParser().parse(wrapper(invalidId))).toBe(false);

        const truncated = new BinaryWriter();
        truncated.writeInt(1); truncated.writeInt(42);
        const parser = new WiredFurniMoveStyleParser();
        expect(parser.parse(wrapper(truncated))).toBe(false);
        expect(parser.itemIds).toEqual([]);
    });
});
