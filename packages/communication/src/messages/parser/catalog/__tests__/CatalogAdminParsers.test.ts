import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { CatalogAdminPageDetailsMessageParser } from '../CatalogAdminPageDetailsMessageParser';
import { CatalogAdminOfferDetailsMessageParser } from '../CatalogAdminOfferDetailsMessageParser';
import { CatalogAdminResultMessageParser } from '../CatalogAdminResultMessageParser';

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

describe('CatalogAdminPageDetailsMessageParser', () =>
{
    it('parses every persisted page field using the database layout code', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(42);
        writer.writeString('Guild shop');
        writer.writeString('guild_shop');
        writer.writeInt(7);
        writer.writeString('BOTH');
        writer.writeString('guild_furni');
        writer.writeInt(3);
        writer.writeInt(145);
        writer.writeInt(5);
        writer.writeInt(9);
        writer.writeByte(1);
        writer.writeByte(0);
        writer.writeByte(1);
        writer.writeByte(0);
        writer.writeString('headline');
        writer.writeString('teaser');
        writer.writeString('special');
        writer.writeString('text one');
        writer.writeString('text two');
        writer.writeString('details');
        writer.writeString('teaser text');
        writer.writeInt(123);
        writer.writeString('1;2;3');

        const parser = new CatalogAdminPageDetailsMessageParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);

        expect(parser.pageId).toBe(42);
        expect((parser as any).parentId).toBe(7);
        expect((parser as any).catalogMode).toBe('BOTH');
        expect((parser as any).layout).toBe('guild_furni');
        expect((parser as any).iconColor).toBe(3);
        expect((parser as any).iconImage).toBe(145);
        expect((parser as any).clubOnly).toBe(true);
        expect((parser as any).vipOnly).toBe(false);
        expect((parser as any).headline).toBe('headline');
        expect((parser as any).teaser).toBe('teaser');
        expect((parser as any).special).toBe('special');
        expect((parser as any).textOne).toBe('text one');
        expect((parser as any).textTwo).toBe('text two');
        expect((parser as any).textDetails).toBe('details');
        expect((parser as any).textTeaser).toBe('teaser text');
        expect((parser as any).roomId).toBe(123);
        expect((parser as any).includes).toBe('1;2;3');
    });
});

describe('CatalogAdminOfferDetailsMessageParser', () =>
{
    it('parses the complete persisted offer instead of relying on the public catalog projection', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(99);
        writer.writeInt(42);
        writer.writeString('100:2;200:5');
        writer.writeString('quantity_bundle');
        writer.writeInt(25);
        writer.writeInt(10);
        writer.writeInt(5);
        writer.writeInt(1);
        writer.writeByte(1);
        writer.writeString('extra');
        writer.writeByte(0);
        writer.writeInt(77);
        writer.writeInt(100);
        writer.writeInt(12);
        writer.writeInt(4);
        writer.writeInt(321);
        writer.writeString('NORMAL');

        const parser = new CatalogAdminOfferDetailsMessageParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);

        expect(parser.offerId).toBe(99);
        expect((parser as any).pageId).toBe(42);
        expect((parser as any).itemIds).toBe('100:2;200:5');
        expect((parser as any).catalogName).toBe('quantity_bundle');
        expect((parser as any).costCredits).toBe(25);
        expect((parser as any).costPoints).toBe(10);
        expect((parser as any).pointsType).toBe(5);
        expect((parser as any).amount).toBe(1);
        expect((parser as any).clubOnly).toBe(true);
        expect((parser as any).extradata).toBe('extra');
        expect((parser as any).haveOffer).toBe(false);
        expect(parser.offerIdGroup).toBe(77);
        expect(parser.limitedStack).toBe(100);
        expect((parser as any).limitedSells).toBe(12);
        expect(parser.orderNumber).toBe(4);
        expect((parser as any).songId).toBe(321);
        expect((parser as any).catalogMode).toBe('NORMAL');
    });
});

describe('CatalogAdminResultMessageParser', () =>
{
    it('keeps legacy two-field results valid', () =>
    {
        const writer = new BinaryWriter();
        writer.writeByte(1);
        writer.writeString('Saved');

        const parser = new CatalogAdminResultMessageParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.success).toBe(true);
        expect(parser.message).toBe('Saved');
        expect(parser.smartSaveResult).toBeNull();
    });

    it('parses a correlated version-one page result', () =>
    {
        const writer = smartSaveWriter(
            true,
            '{"catalogType":"NORMAL","pageId":42,"parentId":-1,"caption":"Guild shop"}',
            '{"id":91,"revision":8,"actorId":9,"actorName":"Alice","summary":"Edit page","source":"UI","createdAt":"2026-08-02T10:05:30Z","entries":[{"entityType":"PAGE","catalogType":"NORMAL","entityId":42,"operation":"UPDATE"}]}',
            '{}');

        const parser = new CatalogAdminResultMessageParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.smartSaveResult).toMatchObject({
            protocolVersion: 1,
            operationId: 'save-page-1',
            action: 'savePage',
            code: 'SAVED',
            draftVersionId: 12,
            revision: 8,
            entityType: 'PAGE',
            catalogType: 'NORMAL',
            entityId: 42,
            serverDurationMs: 17
        });
        expect(parser.smartSaveResult?.entity).toMatchObject({ pageId: 42, caption: 'Guild shop' });
        expect(parser.smartSaveResult?.historyGroup?.entries[0].operation).toBe('UPDATE');
    });

    it('parses field errors on a result without an entity or history group', () =>
    {
        const writer = smartSaveWriter(false, '', 'null', '{"caption":"Page caption is required"}', 0);
        const parser = new CatalogAdminResultMessageParser();

        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.success).toBe(false);
        expect(parser.smartSaveResult?.entity).toBeNull();
        expect(parser.smartSaveResult?.historyGroup).toBeNull();
        expect(parser.smartSaveResult?.fieldErrors.caption).toBe('Page caption is required');
    });

    it('preserves the legacy result when the optional extension is malformed', () =>
    {
        const writer = smartSaveWriter(true, '{bad json', 'null', '{}');
        const parser = new CatalogAdminResultMessageParser();

        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.success).toBe(true);
        expect(parser.message).toBe('Saved');
        expect(parser.smartSaveResult).toBeNull();
    });
});

const smartSaveWriter = (
    success: boolean,
    entityJson: string,
    historyJson: string,
    fieldErrorsJson: string,
    entityId = 42) =>
{
    const writer = new BinaryWriter();
    writer.writeByte(success ? 1 : 0);
    writer.writeString(success ? 'Saved' : 'Page caption is required');
    writer.writeInt(1);
    writer.writeString('save-page-1');
    writer.writeString('savePage');
    writer.writeString(success ? 'SAVED' : 'VALIDATION_FAILED');
    writer.writeInt(12);
    writer.writeInt(8);
    writer.writeString('PAGE');
    writer.writeString('NORMAL');
    writer.writeInt(entityId);
    writer.writeString(entityJson);
    writer.writeString(historyJson);
    writer.writeString(fieldErrorsJson);
    writer.writeInt(17);
    return writer;
};
