import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WiredGenerateWebApiKeyComposer } from '../../outgoing/roomevents/WiredGenerateWebApiKeyComposer';
import { WiredWebApiKeyResultParser } from './WiredWebApiKeyResultParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readBoolean()
    {
        return this.reader.readByte() === 1;
    }
    readInt()
    {
        return this.reader.readInt();
    }
    readString()
    {
        const length = this.reader.readShort(); return this.reader.readBytes(length).toString();
    }
}

describe('WiredWebApiKeyResultParser', () =>
{
    it('reads the item id, the key kind and the key', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(812); writer.writeByte(0); writer.writeString('kR2x-9_abc');
        const parser = new WiredWebApiKeyResultParser();

        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.itemId).toBe(812);
        expect(parser.isReadKey).toBe(false);
        expect(parser.key).toBe('kR2x-9_abc');
    });

    it('flushes back to an empty result', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(5); writer.writeByte(1); writer.writeString('k');
        const parser = new WiredWebApiKeyResultParser();
        parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any);

        parser.flush();

        expect([ parser.itemId, parser.isReadKey, parser.key ]).toEqual([ 0, false, '' ]);
    });
});

describe('WiredGenerateWebApiKeyComposer', () =>
{
    it('sends the item id and whether the read key is wanted', () =>
    {
        expect(new WiredGenerateWebApiKeyComposer(812, true).getMessageArray()).toEqual([ 812, true ]);
        expect(new WiredGenerateWebApiKeyComposer(812, false).getMessageArray()).toEqual([ 812, false ]);
    });
});
