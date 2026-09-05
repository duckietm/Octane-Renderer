import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { OctaneMessages } from '../../../../OctaneMessages';
import { IncomingHeader } from '../../../incoming/IncomingHeader';
import { OutgoingHeader } from '../../../outgoing/OutgoingHeader';
import { CatalogProductMetadataComposer } from '../../../outgoing/catalog/metadata';
import { CatalogProductMetadataMessageParser } from '../../../parser/catalog/metadata';

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

describe('catalog product metadata packet contract', () =>
{
    it('registers a separate optional request and response on header 10081', () =>
    {
        const messages = new OctaneMessages();

        expect(OutgoingHeader.CATALOG_PRODUCT_METADATA).toBe(10081);
        expect(IncomingHeader.CATALOG_PRODUCT_METADATA).toBe(10081);
        expect(messages.composers.has(10081)).toBe(true);
        expect(messages.events.has(10081)).toBe(true);
    });

    it('serializes a versioned page request without changing catalog page packets', () =>
    {
        expect(new CatalogProductMetadataComposer('metadata-1', 33, 'NORMAL').getMessageArray())
            .toEqual([ 1, 'metadata-1', 33, 'NORMAL' ]);
    });

    it('parses bounded item metadata and exposes capability flags', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1);
        writer.writeString('metadata-1');
        writer.writeInt(33);
        writer.writeInt(2);
        writer.writeInt(51); writer.writeInt(701); writer.writeInt(9001); writer.writeByte(3);
        writer.writeInt(52); writer.writeInt(702); writer.writeInt(9002); writer.writeByte(1);

        const parser = new CatalogProductMetadataMessageParser();

        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser).toMatchObject({ protocolVersion: 1, requestId: 'metadata-1', pageId: 33 });
        expect(parser.entries).toEqual([
            { offerId: 51, itemBaseId: 701, productClassId: 9001, tradeable: true, recyclable: true },
            { offerId: 52, itemBaseId: 702, productClassId: 9002, tradeable: true, recyclable: false }
        ]);
    });

    it('rejects oversized payloads before reading unbounded entries', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1);
        writer.writeString('metadata-oversized');
        writer.writeInt(33);
        writer.writeInt(501);

        const parser = new CatalogProductMetadataMessageParser();

        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(false);
        expect(parser.entries).toEqual([]);
    });
});
