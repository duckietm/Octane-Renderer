import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../EvaWireDataWrapper';
import { EvaWireFormat } from '../EvaWireFormat';

// A string's length goes out as an unsigned short. Past 65535 bytes it wrapped while every byte was still written,
// and the server read the tail of the string as the fields after it.
describe('EvaWireFormat string length', () =>
{
    it('writes the longest string a short can describe, and the field after it', () =>
    {
        const text = 'w'.repeat(BinaryWriter.MAX_STRING_BYTES);
        const encoded = new EvaWireFormat().encode(1, [ text, 7 ]);
        const reader = new BinaryReader(encoded.getBuffer());

        reader.readInt();

        const wrapper = new EvaWireDataWrapper(reader.readShort(), reader);

        expect(wrapper.readString()).toBe(text);
        expect(wrapper.readInt()).toBe(7);
    });

    it('drops a packet whose string does not fit instead of sending a corrupted one', () =>
    {
        expect(new EvaWireFormat().encode(1, [ 'w'.repeat(BinaryWriter.MAX_STRING_BYTES + 1), 7 ])).toBeNull();
    });

    it('refuses the string in the writer itself', () =>
    {
        expect(() => new BinaryWriter().writeString('é'.repeat(40_000))).toThrow(RangeError);
    });
});

// An undefined field went out as a 2-byte empty string even where the server reads an int, shifting every field after it.
describe('EvaWireFormat missing fields', () =>
{
    it('drops a packet with an undefined field', () =>
    {
        expect(new EvaWireFormat().encode(1, [ 5, undefined, 7 ])).toBeNull();
    });

    it('still writes null as an empty string', () =>
    {
        const encoded = new EvaWireFormat().encode(1, [ null, 7 ]);
        const reader = new BinaryReader(encoded.getBuffer());

        reader.readInt();

        const wrapper = new EvaWireDataWrapper(reader.readShort(), reader);

        expect(wrapper.readString()).toBe('');
        expect(wrapper.readInt()).toBe(7);
    });
});
