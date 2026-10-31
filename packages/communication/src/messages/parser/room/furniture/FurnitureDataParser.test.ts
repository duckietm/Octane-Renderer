import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { FurnitureDataParser } from './FurnitureDataParser';

const wrap = (write: (writer: BinaryWriter) => void): EvaWireDataWrapper =>
{
    const writer = new BinaryWriter();

    write(writer);

    return new EvaWireDataWrapper(0, new BinaryReader(writer.getBuffer()));
};

// An unknown stuff data format returned null without reading its payload, so the next furni read that payload as
// its own fields.
describe('FurnitureDataParser stuff data', () =>
{
    it('reads a known format and leaves the next field in place', () =>
    {
        const wrapper = wrap(writer =>
        {
            writer.writeInt(0);
            writer.writeString('1');
            writer.writeInt(42);
        });

        expect(FurnitureDataParser.parseObjectData(wrapper).getLegacyString()).toBe('1');
        expect(wrapper.readInt()).toBe(42);
    });

    it('refuses an unknown format instead of misreading what follows', () =>
    {
        const wrapper = wrap(writer =>
        {
            writer.writeInt(99);
            writer.writeString('payload');
        });

        expect(() => FurnitureDataParser.parseObjectData(wrapper)).toThrow('Unknown stuff data format 99');
    });
});
