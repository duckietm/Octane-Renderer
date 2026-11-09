import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { ModeratorUserRecordsParser } from '../ModeratorUserRecordsParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readByte()
    {
        return this.reader.readByte();
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
        const len = this.reader.readShort(); return this.reader.readBytes(len).toString();
    }
    header = 0;
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
}

const parse = (w: BinaryWriter) =>
{
    const parser = new ModeratorUserRecordsParser();
    parser.flush();
    parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())) as any);
    return parser;
};

describe('ModeratorUserRecordsParser', () =>
{
    it('parses the header fields and two records', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(42); w.writeInt(1); w.writeInt(3); w.writeInt(2);
        w.writeInt(1700000000); w.writeString('Alex'); w.writeString('Mod'); w.writeString('ban'); w.writeString('Spam'); w.writeInt(1700086400);
        w.writeInt(1700000500); w.writeString('Alex'); w.writeString(''); w.writeString('ip_ban'); w.writeString(''); w.writeInt(0);

        const parser = parse(w);

        expect(parser.userId).toBe(42);
        expect(parser.kind).toBe(1);
        expect(parser.undetailed).toBe(3);
        expect(parser.records).toHaveLength(2);

        const [ first, second ] = parser.records;
        expect(first.timestamp).toBe(1700000000);
        expect(first.username).toBe('Alex');
        expect(first.staffName).toBe('Mod');
        expect(first.type).toBe('ban');
        expect(first.reason).toBe('Spam');
        expect(first.expires).toBe(1700086400);
        expect(second.timestamp).toBe(1700000500);
        expect(second.staffName).toBe('');
        expect(second.type).toBe('ip_ban');
        expect(second.reason).toBe('');
        expect(second.expires).toBe(0);
    });

    it('flush resets the defaults', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(7); w.writeInt(3); w.writeInt(0); w.writeInt(1);
        w.writeInt(1); w.writeString('a'); w.writeString('b'); w.writeString('c'); w.writeString('d'); w.writeInt(2);

        const parser = parse(w);
        expect(parser.records).toHaveLength(1);

        parser.flush();
        expect(parser.userId).toBe(0);
        expect(parser.kind).toBe(0);
        expect(parser.undetailed).toBe(0);
        expect(parser.records).toEqual([]);
    });
});
