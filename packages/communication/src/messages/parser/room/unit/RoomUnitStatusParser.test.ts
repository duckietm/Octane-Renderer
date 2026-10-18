import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { RoomUnitStatusParser } from './RoomUnitStatusParser';

// Same field order as the emulator's RoomUserStatusComposer record.
const statusOf = (actions: string) =>
{
    const writer = new BinaryWriter();

    writer.writeInt(1);
    writer.writeInt(7).writeInt(4).writeInt(6);
    writer.writeString('1.5');
    writer.writeInt(2).writeInt(2);
    writer.writeString(actions);

    const parser = new RoomUnitStatusParser();

    parser.flush();

    parser.parse(new EvaWireDataWrapper(1640, new BinaryReader(writer.getBuffer())));

    return parser.statuses[0];
};

describe('RoomUnitStatusParser lay', () =>
{
    it('lifts the avatar by the bed height Habbo sends', () =>
    {
        const status = statusOf('/lay 1.73/');

        expect(status.z).toBe(1.5);
        expect(status.height).toBe(1.73);
        expect(status.actions.map(action => [ action.action, action.value ])).toEqual([ [ 'lay', '1.73' ] ]);
    });

    // AIR: localZ = Math.abs(lay height); the sign only lays the avatar inside the furni.
    it('lifts by the absolute height of a negative lay', () =>
    {
        expect(statusOf('/lay -1.2/').height).toBe(1.2);
    });
});
