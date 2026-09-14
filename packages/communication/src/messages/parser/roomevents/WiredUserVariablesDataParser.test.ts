import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WiredUserVariablesDataParser } from './WiredUserVariablesDataParser';

class TestWrapper
{
    constructor(private reader: BinaryReader) {}
    readByte() { return this.reader.readByte(); }
    readBoolean() { return this.reader.readByte() === 1; }
    readShort() { return this.reader.readShort(); }
    readInt() { return this.reader.readInt(); }
    readString() { const length = this.reader.readShort(); return this.reader.readBytes(length).toString(); }
    header = 0;
    get bytesAvailable() { return this.reader.remaining() > 0; }
    get remainingBytes() { return this.reader.remaining(); }
}

const wrapper = (writer: BinaryWriter) => new TestWrapper(new BinaryReader(writer.getBuffer())) as any;

const basePacket = () =>
{
    const writer = new BinaryWriter();
    writer.writeInt(77);
    writer.writeInt(1);
    writer.writeInt(42); writer.writeString('Inventory'); writer.writeByte(0); writer.writeInt(1); writer.writeByte(0); writer.writeByte(0);
    writer.writeInt(0);
    writer.writeInt(0); writer.writeInt(0);
    writer.writeInt(0); writer.writeInt(0);
    writer.writeInt(0);

    return writer;
};

describe('WiredUserVariablesDataParser', () =>
{
    it('merges optional array metadata into the matching definition', () =>
    {
        const writer = basePacket();
        writer.writeString(JSON.stringify([ {
            itemId: 42,
            variableType: 2,
            valueShape: 'array',
            arrayFormat: 'record',
            arrayMode: 'slots',
            maxEntries: 64,
            fields: [ { id: 7, name: 'ItemID', order: 0, textConnected: true } ],
            permanent: true
        } ]));
        const parser = new WiredUserVariablesDataParser();

        expect(parser.parse(wrapper(writer))).toBe(true);
        expect(parser.definitions[0]).toMatchObject({
            itemId: 42,
            valueShape: 'array',
            arrayFormat: 'record',
            arrayMode: 'slots',
            maxEntries: 64,
            fields: [ { id: 7, name: 'ItemID', order: 0, textConnected: true } ],
            permanent: true
        });
    });

    it('marks a schema the server could not parse as unavailable instead of a scalar', () =>
    {
        const writer = basePacket();
        writer.writeString(JSON.stringify([ { itemId: 42, variableType: 2, valueShape: 'array_unavailable', maxEntries: 0, fields: [] } ]));
        const parser = new WiredUserVariablesDataParser();

        expect(parser.parse(wrapper(writer))).toBe(true);
        expect(parser.definitions[0].unavailable).toBe(true);
        expect(parser.definitions[0].hasValue).toBe(false);
        expect(parser.definitions[0].valueShape).toBeUndefined();
    });

    it('keeps the legacy packet valid when optional metadata is absent or malformed', () =>
    {
        const legacy = new WiredUserVariablesDataParser();
        expect(legacy.parse(wrapper(basePacket()))).toBe(true);
        expect(legacy.definitions[0].valueShape).toBeUndefined();

        const malformedWriter = basePacket();
        malformedWriter.writeString('{');
        const malformed = new WiredUserVariablesDataParser();
        expect(malformed.parse(wrapper(malformedWriter))).toBe(true);
        expect(malformed.definitions[0].name).toBe('Inventory');
    });
});
