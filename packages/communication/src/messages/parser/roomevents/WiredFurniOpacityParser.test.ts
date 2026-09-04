import { BinaryReader, BinaryWriter } from '@nitrots/utils';
import { describe, expect, it } from 'vitest';
import { WiredFurniOpacityParser } from './WiredFurniOpacityParser';

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

describe('WiredFurniOpacityParser', () =>
{
    it('parses and clamps a valid bounded update', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1); writer.writeInt(77); writer.writeInt(1);
        writer.writeInt(42); writer.writeByte(1); writer.writeInt(180); writer.writeByte(1); writer.writeInt(9); writer.writeInt(20000);
        const parser = new WiredFurniOpacityParser();

        expect(parser.parse(wrapper(writer))).toBe(true);
        expect(parser.roomId).toBe(77);
        expect(parser.updates).toEqual([ {
            itemId: 42,
            wallItem: true,
            opacity: 100,
            clickThrough: true,
            easing: 4,
            durationMs: 10000
        } ]);
    });

    it('rejects unsupported protocol versions', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(2); writer.writeInt(77); writer.writeInt(0);
        expect(new WiredFurniOpacityParser().parse(wrapper(writer))).toBe(false);
    });

    it('rejects oversized counts before allocating or looping', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1); writer.writeInt(77); writer.writeInt(1001);
        expect(new WiredFurniOpacityParser().parse(wrapper(writer))).toBe(false);
    });

    it('rejects a truncated row without exposing partial updates', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1); writer.writeInt(77); writer.writeInt(1); writer.writeInt(42);
        const parser = new WiredFurniOpacityParser();

        expect(parser.parse(wrapper(writer))).toBe(false);
        expect(parser.updates).toEqual([]);
    });
});
