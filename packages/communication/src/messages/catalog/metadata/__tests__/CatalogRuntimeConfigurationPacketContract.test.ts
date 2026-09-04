import { BinaryReader, BinaryWriter } from '@nitrots/utils';
import { describe, expect, it } from 'vitest';
import { NitroMessages } from '../../../../NitroMessages';
import { IncomingHeader } from '../../../incoming/IncomingHeader';
import { OutgoingHeader } from '../../../outgoing/OutgoingHeader';
import { CatalogRuntimeConfigurationComposer } from '../../../outgoing/catalog/configuration';
import { CatalogRuntimeConfigurationMessageParser } from '../../../parser/catalog/configuration';

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

describe('catalog runtime configuration packet contract', () =>
{
    it('registers the optional versioned request and response on header 10082', () =>
    {
        const messages = new NitroMessages();

        expect(OutgoingHeader.CATALOG_RUNTIME_CONFIGURATION).toBe(10082);
        expect(IncomingHeader.CATALOG_RUNTIME_CONFIGURATION).toBe(10082);
        expect(messages.composers.has(10082)).toBe(true);
        expect(messages.events.has(10082)).toBe(true);
        expect(new CatalogRuntimeConfigurationComposer('runtime-1').getMessageArray()).toEqual([ 1, 'runtime-1' ]);
    });

    it('parses the authoritative recycler slot count', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1);
        writer.writeString('runtime-1');
        writer.writeInt(6);

        const parser = new CatalogRuntimeConfigurationMessageParser();

        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser).toMatchObject({ protocolVersion: 1, requestId: 'runtime-1', recyclerSlotCount: 6 });
    });
});
