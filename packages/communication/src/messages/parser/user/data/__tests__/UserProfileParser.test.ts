import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { UserProfileParser } from '../UserProfileParser';

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
}

const writeProfile = (writer: BinaryWriter) =>
{
    writer.writeInt(7);
    writer.writeString('tester');
    writer.writeString('hd-180-1');
    writer.writeString('motto');
    writer.writeString('01-01-2026');
    writer.writeInt(424);
    writer.writeInt(3);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(1);
    writer.writeInt(0);
    writer.writeInt(60);
    writer.writeByte(1);
    writer.writeInt(1);
    writer.writeInt(2);
    writer.writeInt(3);
    writer.writeInt(4);
    writer.writeString('');
    ['', '', '', '', '', 'icon-prefix-name'].forEach(value => writer.writeString(value));
    writer.writeInt(14);
};

const parse = (writer: BinaryWriter) =>
{
    const parser = new UserProfileParser();

    parser.flush();
    expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);

    return parser;
};

describe('UserProfileParser presence and level', () =>
{
    it('reads the presence and level block after the badge total', () =>
    {
        const writer = new BinaryWriter();

        writeProfile(writer);
        writer.writeInt(2);
        writer.writeInt(8);
        writer.writeInt(500);

        const parser = parse(writer);

        expect(parser.totalBadges).toBe(14);
        expect(parser.onlineStatus).toBe(2);
        expect(parser.level).toBe(8);
        expect(parser.nextLevelStart).toBe(500);
    });

    it('keeps the defaults when the server stops at the badge total', () =>
    {
        const writer = new BinaryWriter();

        writeProfile(writer);

        const parser = parse(writer);

        expect(parser.totalBadges).toBe(14);
        expect(parser.onlineStatus).toBe(-1);
        expect(parser.level).toBe(0);
        expect(parser.nextLevelStart).toBe(0);
    });
});
