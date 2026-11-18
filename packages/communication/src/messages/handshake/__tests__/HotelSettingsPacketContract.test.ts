import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { OctaneMessages } from '../../../OctaneMessages';
import { IncomingHeader } from '../../incoming/IncomingHeader';
import { HotelSettingsParser } from '../../parser/handshake';

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

const write = (cameraUrl: string, limits: number[], aliases: string[]): HotelSettingsParser =>
{
    const writer = new BinaryWriter();
    writer.writeInt(1);
    writer.writeString(cameraUrl);
    limits.forEach(limit => writer.writeInt(limit));
    aliases.forEach(list => writer.writeString(list));

    const parser = new HotelSettingsParser();

    expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);

    return parser;
};

describe('hotel settings packet contract', () =>
{
    it('registers the server settings on header 9477', () =>
    {
        expect(IncomingHeader.HOTEL_SETTINGS).toBe(9477);
        expect(new OctaneMessages().events.has(9477)).toBe(true);
    });

    it('reads the photo address, the four lengths and the three alias lists in the server order', () =>
    {
        const parser = write('http://localhost/camera/', [ 100, 38, 15, 16 ], [ 'all,everyone,tutti', 'friends, amici', 'room,stanza' ]);

        expect(parser).toMatchObject({
            protocolVersion: 1,
            cameraUrl: 'http://localhost/camera/',
            chatMaxLength: 100,
            mottoMaxLength: 38,
            botNameMaxLength: 15,
            petNameMaxLength: 16,
            everyoneAliases: [ 'all', 'everyone', 'tutti' ],
            friendsAliases: [ 'friends', 'amici' ],
            roomAliases: [ 'room', 'stanza' ]
        });
    });

    it('keeps empty alias lists empty', () =>
    {
        const parser = write('', [ 0, 0, 0, 0 ], [ '', '', '' ]);

        expect(parser.everyoneAliases).toEqual([]);
        expect(parser.friendsAliases).toEqual([]);
        expect(parser.roomAliases).toEqual([]);
    });
});
