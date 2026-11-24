import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { WIRED_PERMANENT_VARIABLE_ACTION_CREATE, WiredPermanentVariableSetComposer, WiredPermanentVariablesRequestComposer, WiredVariableDeleteAllHoldersComposer } from '../../outgoing/roomevents';
import { WiredPermanentVariableResultParser } from './WiredPermanentVariableResultParser';
import { WiredUserPermanentVariablesListParser } from './WiredUserPermanentVariablesListParser';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readByte()
    {
        return this.reader.readByte();
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
    readString()
    {
        const length = this.reader.readShort(); return this.reader.readBytes(length).toString();
    }
    header = 0;
    get bytesAvailable()
    {
        return this.reader.remaining() > 0;
    }
    get remainingBytes()
    {
        return this.reader.remaining();
    }
}

const wrapper = (writer: BinaryWriter) => new TestWrapper(new BinaryReader(writer.getBuffer())) as any;

const variable = (writer: BinaryWriter, id: string, value: number) =>
    writer.writeString(id).writeInt(value).writeInt(0).writeInt(100000).writeString('created').writeInt(0).writeInt(200000).writeString('updated');

describe('official permanent variable messages', () =>
{
    it('reads a Habbo holder without an owner block', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(1).writeInt(7).writeString('dave').writeString('hr-1').writeInt(2);
        variable(writer, 'user:10', 5);
        variable(writer, 'user:12', -3);

        const parser = new WiredUserPermanentVariablesListParser();
        parser.flush();
        parser.parse(wrapper(writer));

        expect(parser.entityType).toBe(1);
        expect(parser.entityId).toBe(7);
        expect(parser.entityName).toBe('dave');
        expect(parser.entityFigure).toBe('hr-1');
        expect(parser.variables).toEqual([
            { variableId: 'user:10', value: 5, creationTime: 100000, creationTimeStr: 'created', lastUpdateTime: 200000, lastUpdateTimeStr: 'updated' },
            { variableId: 'user:12', value: -3, creationTime: 100000, creationTimeStr: 'created', lastUpdateTime: 200000, lastUpdateTimeStr: 'updated' }
        ]);
    });

    it('reads the result', () =>
    {
        const parser = new WiredPermanentVariableResultParser();
        parser.flush();
        const writer = new BinaryWriter();
        writer.writeByte(1);
        parser.parse(wrapper(writer));

        expect(parser.success).toBe(true);
    });

    it('sends the requests in the official field order', () =>
    {
        expect(new WiredPermanentVariablesRequestComposer(1, 7).getMessageArray()).toEqual([ 1, 7 ]);
        expect(new WiredPermanentVariableSetComposer(1, 7, 'user:10', 5, WIRED_PERMANENT_VARIABLE_ACTION_CREATE).getMessageArray()).toEqual([ 1, 7, 'user:10', 5, 1 ]);
        expect(new WiredVariableDeleteAllHoldersComposer('user:10').getMessageArray()).toEqual([ 'user:10' ]);
    });
});
