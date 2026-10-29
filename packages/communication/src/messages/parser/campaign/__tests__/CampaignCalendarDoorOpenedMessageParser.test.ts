import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { CampaignCalendarData } from '../CampaignCalendarData';
import { CampaignCalendarDoorOpenedMessageParser } from '../CampaignCalendarDoorOpenedMessageParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readBoolean()
    {
        return this.reader.readByte() === 1;
    }
    readInt()
    {
        return this.reader.readInt();
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

const airPacket = () =>
{
    const writer = new BinaryWriter();
    writer.writeByte(1);
    writer.writeString('Round Man');
    writer.writeString('');
    writer.writeString('roundman');
    return writer;
};

const parse = (writer: BinaryWriter) =>
{
    const parser = new CampaignCalendarDoorOpenedMessageParser();
    parser.flush();
    expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
    return parser;
};

describe('CampaignCalendarDoorOpenedMessageParser', () =>
{
    it('reads AIR\'s packet and leaves the reward contents empty', () =>
    {
        const parser = parse(airPacket());

        expect(parser.doorOpened).toBe(true);
        expect(parser.productName).toBe('Round Man');
        expect(parser.furnitureClassName).toBe('roundman');
        expect(parser.badgeCode).toBe('');
        expect(parser.credits).toBe(0);
        expect(parser.subscriptionDays).toBe(0);
    });

    it('reads what the reward holds when the server sends it', () =>
    {
        const writer = airPacket();
        writer.writeString('ACH_Login1');
        writer.writeInt(50);
        writer.writeInt(200);
        writer.writeInt(5);
        writer.writeInt(5);
        writer.writeString('HABBO_CLUB');
        writer.writeInt(7);

        const parser = parse(writer);

        expect(parser.badgeCode).toBe('ACH_Login1');
        expect(parser.credits).toBe(50);
        expect(parser.pixels).toBe(200);
        expect(parser.points).toBe(5);
        expect(parser.pointsType).toBe(5);
        expect(parser.subscriptionType).toBe('HABBO_CLUB');
        expect(parser.subscriptionDays).toBe(7);
    });
});

describe('CampaignCalendarData', () =>
{
    const calendar = () =>
    {
        const writer = new BinaryWriter();
        writer.writeString('xmas');
        writer.writeString('');
        writer.writeInt(5);
        writer.writeInt(24);
        writer.writeInt(1); writer.writeInt(3);
        writer.writeInt(0);
        return writer;
    };

    const read = (writer: BinaryWriter) =>
    {
        const data = new CampaignCalendarData();
        expect(data.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        return data;
    };

    it('reads AIR\'s calendar without rewards', () =>
    {
        const data = read(calendar());

        expect(data.openedDays).toEqual([3]);
        expect(data.openedRewards.size).toBe(0);
    });

    it('reads what each opened day held', () =>
    {
        const writer = calendar();
        writer.writeInt(1);
        writer.writeInt(3);
        writer.writeString('50 credits'); writer.writeString(''); writer.writeString('');
        writer.writeString(''); writer.writeInt(50); writer.writeInt(0); writer.writeInt(0); writer.writeInt(0);
        writer.writeString(''); writer.writeInt(0);

        const reward = read(writer).openedRewards.get(3);

        expect(reward?.productName).toBe('50 credits');
        expect(reward?.credits).toBe(50);
        expect(read(writer).clone().openedRewards.get(3)?.credits).toBe(50);
    });
});
