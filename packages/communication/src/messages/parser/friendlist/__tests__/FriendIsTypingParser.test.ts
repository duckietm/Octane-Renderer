import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { FriendIsTypingParser } from '../FriendIsTypingParser';

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
        const len = this.reader.readShort(); return this.reader.readBytes(len).toString();
    }
    header = 0;
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
}

describe('FriendIsTypingParser', () =>
{
    it('parses senderId + isTyping=true', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(42); w.writeByte(1);
        const parser = new FriendIsTypingParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())) as any);
        expect(parser.senderId).toBe(42);
        expect(parser.isTyping).toBe(true);
    });

    it('parses isTyping=false', () =>
    {
        const w = new BinaryWriter();
        w.writeInt(42); w.writeByte(0);
        const parser = new FriendIsTypingParser();
        parser.flush();
        parser.parse(new TestWrapper(new BinaryReader(w.getBuffer())) as any);
        expect(parser.isTyping).toBe(false);
    });
});
