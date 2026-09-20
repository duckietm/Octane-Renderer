import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { ProfileAchievementsParser } from '../ProfileAchievementsParser';

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

describe('ProfileAchievementsParser', () =>
{
    it('reads the user id and the previewed entries in order', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(7);
        writer.writeInt(2);
        writer.writeString('ACH_Motto3');
        writer.writeInt(3);
        writer.writeInt(5);
        writer.writeInt(30);
        writer.writeString('ACH_Login1');
        writer.writeInt(1);
        writer.writeInt(10);
        writer.writeInt(10);

        const parser = new ProfileAchievementsParser();
        parser.flush();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.userId).toBe(7);
        expect(parser.entries).toEqual([
            { badgeCode: 'ACH_Motto3', level: 3, levelCount: 5, points: 30 },
            { badgeCode: 'ACH_Login1', level: 1, levelCount: 10, points: 10 }
        ]);
    });
});
