import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@nitrots/utils';
import { SoundboardPlayParser } from '../SoundboardPlayParser';
import { SoundboardCatalogParser } from '../SoundboardCatalogParser';
import { SoundboardCatalogResultParser } from '../SoundboardCatalogResultParser';
import { SoundboardPlayDeniedParser } from '../SoundboardPlayDeniedParser';
import { SoundboardSettingsParser } from '../SoundboardSettingsParser';

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

describe('SoundboardSettingsParser', () =>
{
    it('parses the personalized cooldown before the filtered sound list', () =>
    {
        const writer = new BinaryWriter();
        writer.writeByte(1);
        writer.writeInt(60);
        writer.writeInt(1);
        writer.writeInt(7);
        writer.writeString('Campanella');
        writer.writeString('/sounds/soundboard/campanella.mp3');

        const parser = new SoundboardSettingsParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);

        expect(parser.enabled).toBe(true);
        expect(parser.cooldownSeconds).toBe(60);
        // No trailing classname block: this is what an emulator that predates
        // asset-backed sounds sends, and it must still parse.
        expect(parser.sounds).toEqual([
            { id: 7, name: 'Campanella', url: '/sounds/soundboard/campanella.mp3', classname: '' }
        ]);

        parser.flush();
        expect(parser.enabled).toBe(false);
        expect(parser.cooldownSeconds).toBe(0);
        expect(parser.sounds).toEqual([]);
    });

    it('reads the trailing classname block for every sound in order', () =>
    {
        const writer = new BinaryWriter();
        writer.writeByte(1);
        writer.writeInt(60);
        writer.writeInt(2);
        writer.writeInt(7);
        writer.writeString('Campanella');
        writer.writeString('');
        writer.writeInt(8);
        writer.writeString('Applauso');
        writer.writeString('');
        writer.writeString('campanella');
        writer.writeString('applauso');

        const parser = new SoundboardSettingsParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);

        expect(parser.sounds).toEqual([
            { id: 7, name: 'Campanella', url: '', classname: 'campanella' },
            { id: 8, name: 'Applauso', url: '', classname: 'applauso' }
        ]);
    });

    it('clamps a negative cooldown to zero', () =>
    {
        const writer = new BinaryWriter();
        writer.writeByte(1);
        writer.writeInt(-5);
        writer.writeInt(0);

        const parser = new SoundboardSettingsParser();
        parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())));

        expect(parser.cooldownSeconds).toBe(0);
    });

    it('rejects more than 500 sounds before allocating entries', () =>
    {
        const writer = new BinaryWriter();
        writer.writeByte(1);
        writer.writeInt(60);
        writer.writeInt(501);

        const parser = new SoundboardSettingsParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(false);
        expect(parser.sounds).toEqual([]);
    });
});

describe('SoundboardPlayParser', () =>
{
    it('parses authoritative sound and actor metadata', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(7);
        writer.writeString('/sounds/soundboard/campanella.mp3');
        writer.writeString('Campanella');
        writer.writeInt(42);
        writer.writeInt(3);
        writer.writeString('Simoleo');

        const parser = new SoundboardPlayParser();
        parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())));

        expect(parser.soundId).toBe(7);
        expect(parser.url).toBe('/sounds/soundboard/campanella.mp3');
        expect(parser.soundName).toBe('Campanella');
        expect(parser.actorUserId).toBe(42);
        expect(parser.actorRoomIndex).toBe(3);
        expect(parser.username).toBe('Simoleo');

        parser.flush();
        expect(parser.soundId).toBe(0);
        expect(parser.url).toBe('');
        expect(parser.soundName).toBe('');
        expect(parser.actorUserId).toBe(0);
        expect(parser.actorRoomIndex).toBe(0);
        expect(parser.username).toBe('');
    });
});

describe('Soundboard management parsers', () =>
{
    it('parses a play denial with its cooldown remainder', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1);
        writer.writeInt(13);

        const parser = new SoundboardPlayDeniedParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.reason).toBe(1);
        expect(parser.remainingSeconds).toBe(13);
    });

    it('parses enabled and disabled catalog entries in management order', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1);
        writer.writeInt(7);
        writer.writeString('Campanella');
        writer.writeString('/sounds/bell.mp3');
        writer.writeByte(0);
        writer.writeInt(20);
        writer.writeInt(5);

        const parser = new SoundboardCatalogParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.sounds).toEqual([
            { id: 7, name: 'Campanella', url: '/sounds/bell.mp3', enabled: false, sortOrder: 20, minRank: 5, classname: '' }
        ]);
    });

    it('rejects an unreasonable catalog size before allocating entries', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(501);

        const parser = new SoundboardCatalogParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(false);
        expect(parser.sounds).toEqual([]);
    });

    it('parses stable catalog result codes', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1);
        writer.writeInt(3);
        writer.writeInt(7);

        const parser = new SoundboardCatalogResultParser();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.operation).toBe(1);
        expect(parser.resultCode).toBe(3);
        expect(parser.soundId).toBe(7);
    });
});
