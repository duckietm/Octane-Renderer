import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WiredArrayInspectionDataParser } from './WiredArrayInspectionDataParser';

class TestWrapper
{
    constructor(private reader: BinaryReader) {}
    readString() { const length = this.reader.readShort(); return this.reader.readBytes(length).toString(); }
}

const parse = (value: string) =>
{
    const writer = new BinaryWriter();
    writer.writeString(value);
    const parser = new WiredArrayInspectionDataParser();
    const wrapper = new TestWrapper(new BinaryReader(writer.getBuffer()));

    return { parser, result: parser.parse(wrapper as any) };
};

describe('WiredArrayInspectionDataParser', () =>
{
    it('keeps 64-bit field values as lossless strings', () =>
    {
        const { parser, result } = parse(JSON.stringify({
            protocolVersion: 1,
            entries: [ { index: 0, occupied: true, values: { 1: '9223372036854775807' }, connectedText: {} } ]
        }));

        expect(result).toBe(true);
        expect(parser.data?.entries[0].values['1']).toBe('9223372036854775807');
    });

    it('rejects malformed and unsupported payloads', () =>
    {
        expect(parse('{').result).toBe(false);
        expect(parse(JSON.stringify({ protocolVersion: 2, entries: [] })).result).toBe(false);
    });
});
