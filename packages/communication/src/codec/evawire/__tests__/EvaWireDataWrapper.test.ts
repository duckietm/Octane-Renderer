import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../EvaWireDataWrapper';

// Polaris writes a string's length as an unsigned short. Read signed, a string of 32768 to 65535
// bytes came out with a negative length: the string was empty and every field after it misread.
describe('EvaWireDataWrapper strings', () =>
{
    const wrap = (writer: BinaryWriter) => new EvaWireDataWrapper(0, new BinaryReader(writer.getBuffer()));

    it('reads a string longer than 32767 bytes and the field after it', () =>
    {
        const text = 'w'.repeat(40_000);
        const writer = new BinaryWriter();
        writer.writeString(text);
        writer.writeInt(1234);

        const wrapper = wrap(writer);

        expect(wrapper.readString()).toBe(text);
        expect(wrapper.readInt()).toBe(1234);
        expect(wrapper.bytesAvailable).toBe(false);
    });

    it('reads a string at the unsigned maximum', () =>
    {
        const text = 'x'.repeat(65_535);
        const writer = new BinaryWriter();
        writer.writeString(text);

        expect(wrap(writer).readString()).toBe(text);
    });

    it('still reads short strings', () =>
    {
        const writer = new BinaryWriter();
        writer.writeString('hello');
        writer.writeString('');

        const wrapper = wrap(writer);

        expect(wrapper.readString()).toBe('hello');
        expect(wrapper.readString()).toBe('');
    });
});

describe('BinaryReader.readBytes bounds', () =>
{
    it('never reads past the end nor moves backwards', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(7);

        const reader = new BinaryReader(writer.getBuffer());

        expect(reader.readBytes(-5).remaining()).toBe(0);
        expect(reader.remaining()).toBe(4);
        expect(reader.readBytes(100).remaining()).toBe(4);
        expect(reader.remaining()).toBe(0);
    });
});
