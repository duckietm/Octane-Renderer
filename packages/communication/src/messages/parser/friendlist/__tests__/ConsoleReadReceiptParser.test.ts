import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { ConsoleReadReceiptParser } from '../ConsoleReadReceiptParser';

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

describe('ConsoleReadReceiptParser', () =>
{
    it('parses the reader id', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(42);
        const parser = new ConsoleReadReceiptParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())) as any);
        expect(parser.readerId).toBe(42);
    });
});
