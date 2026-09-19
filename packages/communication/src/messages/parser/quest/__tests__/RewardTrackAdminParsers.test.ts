import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { SaveRewardTrackTaskMessageComposer } from '../../../outgoing/quest/SaveRewardTrackTaskMessageComposer';
import { RewardTrackAdminDataMessageParser } from '../RewardTrackAdminDataMessageParser';
import { RewardTrackAdminResultMessageParser } from '../RewardTrackAdminResultMessageParser';

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

describe('RewardTrackAdminDataMessageParser', () =>
{
    it('reads the choices, then every track with its tasks, levels and prizes, in the order the emulator writes them', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(2);
        writer.writeString('chat_with_someone');
        writer.writeString('place_item');
        writer.writeInt(2);
        writer.writeString('duckets');
        writer.writeString('badge');
        writer.writeInt(1);
        writer.writeString('season_1');
        writer.writeString('blue');
        writer.writeInt(2);
        writer.writeInt(100);
        writer.writeInt(200);
        writer.writeByte(1);
        writer.writeInt(150);
        writer.writeInt(50);
        writer.writeInt(25);
        writer.writeInt(0);
        writer.writeByte(0);
        writer.writeInt(1);
        writer.writeString('talk');
        writer.writeString('chat_with_someone');
        writer.writeString('');
        writer.writeByte(0);
        writer.writeInt(1);
        writer.writeInt(2);
        writer.writeInt(2);
        writer.writeInt(10);
        writer.writeByte(0);
        writer.writeInt(4);
        writer.writeInt(20);
        writer.writeByte(1);
        writer.writeInt(1);
        writer.writeString('p1');
        writer.writeInt(10);
        writer.writeInt(7);
        writer.writeString('badge');
        writer.writeString('ACH_1');
        writer.writeInt(1);
        writer.writeByte(1);
        writer.writeInt(3);
        writer.writeInt(7);
        writer.writeInt(1);
        writer.writeString('name');
        writer.writeString('Season 1');

        const parser = new RewardTrackAdminDataMessageParser();
        parser.flush();
        const wrapper = new TestWrapper(new BinaryReader(writer.getBuffer()));
        expect(parser.parse(wrapper as any)).toBe(true);
        expect(wrapper.bytesAvailable).toBe(false);

        expect(parser.actionTypes).toEqual([ 'chat_with_someone', 'place_item' ]);
        expect(parser.rewardTypes).toEqual([ 'duckets', 'badge' ]);
        expect(parser.tracks).toHaveLength(1);

        const track = parser.tracks[0];
        expect(track.id).toBe('season_1');
        expect(track.theme).toBe('blue');
        expect(track.sortOrder).toBe(2);
        expect(track.startsAt).toBe(100);
        expect(track.endsAt).toBe(200);
        expect(track.hasPremium).toBe(true);
        expect(track.premiumBoostPercent).toBe(150);
        expect(track.premiumInstantPoints).toBe(50);
        expect(track.premiumCostDiamonds).toBe(25);
        expect(track.premiumCostCredits).toBe(0);
        expect(track.enabled).toBe(false);
        expect(track.tasks).toEqual([
            { id: 'talk', actionType: 'chat_with_someone', parameter: '', premium: false, sortOrder: 1, levels: [
                { requiredCount: 2, pointsReward: 10, premium: false },
                { requiredCount: 4, pointsReward: 20, premium: true }
            ] }
        ]);
        expect(track.prizes).toEqual([
            { id: 'p1', requiredPoints: 10, productItemTypeId: 7, rewardType: 'badge', extraParams: 'ACH_1', rewardAmount: 1, premium: true, sortOrder: 3, claimedCount: 7 }
        ]);
        expect(track.texts).toEqual({ name: 'Season 1' });
    });
});

describe('RewardTrackAdminResultMessageParser', () =>
{
    it('reads the outcome and what was touched', () =>
    {
        const writer = new BinaryWriter();
        writer.writeByte(0);
        writer.writeString('Unknown action type: x');
        writer.writeString('task');
        writer.writeString('season_1');
        writer.writeString('t');

        const parser = new RewardTrackAdminResultMessageParser();
        parser.flush();
        expect(parser.parse(new TestWrapper(new BinaryReader(writer.getBuffer())) as any)).toBe(true);
        expect(parser.success).toBe(false);
        expect(parser.message).toBe('Unknown action type: x');
        expect(parser.entity).toBe('task');
        expect(parser.trackId).toBe('season_1');
        expect(parser.id).toBe('t');
    });
});

describe('SaveRewardTrackTaskMessageComposer', () =>
{
    it('flattens the levels behind their count, as the emulator reads them', () =>
    {
        const composer = new SaveRewardTrackTaskMessageComposer('season_1', 'talk', 'chat_with_someone', '', false, 1, [
            { requiredCount: 2, pointsReward: 10, premium: false },
            { requiredCount: 4, pointsReward: 20, premium: true }
        ]);

        expect(composer.getMessageArray()).toEqual([ 'season_1', 'talk', 'chat_with_someone', '', false, 1, 2, 2, 10, false, 4, 20, true ]);
    });
});
