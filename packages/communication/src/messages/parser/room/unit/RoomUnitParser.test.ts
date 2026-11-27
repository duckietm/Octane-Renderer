import { describe, expect, it } from 'vitest';
import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { RoomUnitParser } from './RoomUnitParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(374, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

// Same field order as the emulator's RoomUsersComposer user record.
const writeUser = (writer: BinaryWriter, id: number, name: string, badgesRank: number, pose: [number, number, number] = [ 2, 0, 0 ]) =>
{
    writer.writeInt(id);
    writer.writeString(name);
    writer.writeString('motto');
    writer.writeInt(0).writeInt(0).writeInt(0).writeInt(0);
    writer.writeString('hd-180-1');
    writer.writeInt(id).writeInt(1).writeInt(2);
    writer.writeString('0.0');
    writer.writeInt(2);
    writer.writeInt(1);
    writer.writeString('M');
    writer.writeInt(-1).writeInt(-1);
    writer.writeString('');
    writer.writeString('');
    writer.writeInt(120);
    writer.writeByte(1);
    for(let i = 0; i < 7; i++) writer.writeString('');
    writer.writeInt(badgesRank);
    pose.forEach(value => writer.writeInt(value));
    writer.writeString('');
    writer.writeInt(0);
    writer.writeInt(0);
};

describe('RoomUnitParser', () =>
{
    it('reads the badges rank of every user without shifting the next record', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(2);
        writeUser(writer, 10, 'Alice', 3);
        writeUser(writer, 11, 'Bob', -1);

        const parser = new RoomUnitParser();

        parser.flush();

        expect(parser.parse(wrapperOf(writer))).toBe(true);
        expect(parser.users.map((user) => [user.name, user.badgesRank, user.activityPoints])).toEqual([
            ['Alice', 3, 120],
            ['Bob', -1, 120]
        ]);
    });

    it('reads the profile picture pose of every user without shifting the next record', () =>
    {
        const writer = new BinaryWriter();

        writer.writeInt(2);
        writeUser(writer, 10, 'Alice', 3, [ 6, -16, 4 ]);
        writeUser(writer, 11, 'Bob', -1);

        const parser = new RoomUnitParser();

        parser.flush();

        expect(parser.parse(wrapperOf(writer))).toBe(true);
        expect(parser.users.map((user) => [ user.name, user.avatarDirection, user.avatarOffsetX, user.avatarOffsetY, user.borderId ])).toEqual([
            [ 'Alice', 6, -16, 4, 0 ],
            [ 'Bob', 2, 0, 0, 0 ]
        ]);
    });
});
