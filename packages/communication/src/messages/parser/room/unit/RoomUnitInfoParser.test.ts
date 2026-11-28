import { describe, expect, it } from 'vitest';
import { IBinaryWriter } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { RoomUnitInfoParser } from './RoomUnitInfoParser';

const wrapperOf = (body: IBinaryWriter) => new EvaWireDataWrapper(3920, new BinaryReader(body.getBuffer() ?? new ArrayBuffer(0)));

// Same field order as the emulator's RoomUserDataComposer, up to the border.
const writeInfo = (writer: BinaryWriter) =>
{
    writer.writeInt(5);
    writer.writeString('hd-180-1');
    writer.writeString('m');
    writer.writeString('motto');
    writer.writeInt(120);
    writer.writeInt(1).writeInt(2).writeInt(3).writeInt(4);
    for(let i = 0; i < 6; i++) writer.writeString('');
    writer.writeString('icon-prefix-name');
    writer.writeInt(17);
};

const parse = (writer: BinaryWriter) =>
{
    const parser = new RoomUnitInfoParser();

    parser.flush();
    expect(parser.parse(wrapperOf(writer))).toBe(true);

    return parser;
};

describe('RoomUnitInfoParser', () =>
{
    it('reads the avatar pose after the border', () =>
    {
        const writer = new BinaryWriter();

        writeInfo(writer);
        writer.writeInt(0).writeInt(16).writeInt(-3);

        const parser = parse(writer);

        expect(parser.borderId).toBe(17);
        expect([ parser.avatarDirection, parser.avatarOffsetX, parser.avatarOffsetY ]).toEqual([ 0, 16, -3 ]);
    });

    it('stands the avatar as before when an older server stops at the border', () =>
    {
        const writer = new BinaryWriter();

        writeInfo(writer);

        const parser = parse(writer);

        expect(parser.borderId).toBe(17);
        expect([ parser.avatarDirection, parser.avatarOffsetX, parser.avatarOffsetY ]).toEqual([ 2, 0, 0 ]);
    });
});
