import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@nitrots/utils';
import { UserSettingsParser } from '../UserSettingsParser';

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

const writeLegacySettings = (writer: BinaryWriter) =>
{
    writer.writeInt(10);
    writer.writeInt(20);
    writer.writeInt(30);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(1);
    writer.writeInt(12);
    writer.writeInt(4);
    writer.writeByte(1);
    writer.writeByte(0);
    writer.writeByte(1);
};

describe('UserSettingsParser Soundboard volume', () =>
{
    it('reads the optional trailing Soundboard volume', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);
        writer.writeInt(40);

        const parser = new UserSettingsParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.volumeSoundboard).toBe(40);
    });

    it('defaults the Soundboard volume for legacy packets and after flush', () =>
    {
        const writer = new BinaryWriter();
        writeLegacySettings(writer);

        const parser = new UserSettingsParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.volumeSoundboard).toBe(80);

        parser.flush();
        expect(parser.volumeSoundboard).toBe(80);
    });
});
