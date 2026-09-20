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
    readBytes(length: number)
    {
        return this.reader.readBytes(length);
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
    readFloat()
    {
        return this.reader.readFloat();
    }
    readDouble()
    {
        return this.reader.readDouble();
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

const writeBaseProfile = (writer: BinaryWriter) =>
{
    writer.writeInt(7);
    writer.writeString('tester');
    writer.writeString('hr-100');
    writer.writeString('motto');
    writer.writeString('06-06-2026');
    writer.writeInt(424);
    writer.writeInt(2);
    writer.writeByte(0);
    writer.writeByte(0);
    writer.writeByte(1);
    writer.writeInt(0);
    writer.writeInt(30);
    writer.writeByte(1);
    writer.writeInt(1);
    writer.writeInt(2);
    writer.writeInt(3);
    writer.writeInt(4);
    writer.writeString('');
    for(let i = 0; i < 6; i++) writer.writeString('');
    writer.writeInt(35);
};

const parse = (writer: BinaryWriter) =>
{
    const parser = new UserProfileParser();
    parser.flush();
    expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
    return parser;
};

describe('UserProfileParser presence and level block', () =>
{
    it('reads the trailing status, room and level', () =>
    {
        const writer = new BinaryWriter();
        writeBaseProfile(writer);
        writer.writeByte(1);
        writer.writeInt(3);
        writer.writeInt(300);
        writer.writeInt(600);

        const parser = parse(writer);
        expect(parser.totalBadges).toBe(35);
        expect(parser.onlineStatus).toBe(1);
        expect(parser.level).toBe(3);
        expect(parser.levelStart).toBe(300);
        expect(parser.nextLevelStart).toBe(600);
    });

    it('defaults the block for servers that do not send it', () =>
    {
        const parser = parse((() => { const writer = new BinaryWriter(); writeBaseProfile(writer); return writer; })());
        expect(parser.isOnline).toBe(true);
        expect(parser.onlineStatus).toBe(0);
        expect(parser.level).toBe(0);
    });
});
