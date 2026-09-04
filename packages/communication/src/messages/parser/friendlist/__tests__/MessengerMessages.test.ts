import { describe, expect, it } from 'vitest';
import { BinaryReader, BinaryWriter } from '@nitrots/utils';
import {
    MessengerConversationsParser,
    MessengerHistoryParser,
    MessengerMessageAckParser,
    MessengerMessageFailedParser,
    MessengerMessageParser,
    MessengerReadCursorParser
} from '..';
import {
    MarkMessengerReadComposer,
    RequestMessengerConversationsComposer,
    RequestMessengerHistoryComposer,
    SendMessengerMessageComposer
} from '../../../outgoing/friendlist';

class TestWrapper
{
    constructor(private reader: BinaryReader)
    {}
    readByte()
    {
        return this.reader.readByte();
    }
    readShort()
    {
        return this.reader.readShort();
    }
    readInt()
    {
        return this.reader.readInt();
    }
    readBoolean()
    {
        return this.reader.readByte() === 1;
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

const wrapper = (write: (writer: BinaryWriter) => void) =>
{
    const writer = new BinaryWriter();
    write(writer);
    return new TestWrapper(new BinaryReader(writer.getBuffer())) as any;
};

describe('messenger composers', () =>
{
    it('serializes exact request payloads', () =>
    {
        expect(new RequestMessengerConversationsComposer().getMessageArray()).toEqual([]);
        expect(new RequestMessengerHistoryComposer(42, 900, 30).getMessageArray()).toEqual([ 42, 900, 30 ]);
        expect(new SendMessengerMessageComposer(42, 7, 11, 0, 'hello', '').getMessageArray()).toEqual([ 42, 7, 11, 0, 'hello', '' ]);
        expect(new MarkMessengerReadComposer(42, 900).getMessageArray()).toEqual([ 42, 900 ]);
    });
});

describe('messenger parsers', () =>
{
    it('parses conversation summaries', () =>
    {
        const parser = new MessengerConversationsParser();
        parser.flush();
        expect(parser.parse(wrapper(w =>
        {
            w.writeInt(1); w.writeInt(42); w.writeInt(0); w.writeInt(7); w.writeString('Alex');
            w.writeInt(900); w.writeInt(3); w.writeInt(1234);
        }))).toBe(true);
        expect(parser.conversations[0]).toMatchObject({ id: 42, participantId: 7, name: 'Alex', unreadCount: 3 });
    });

    it('parses history and canonical message payloads', () =>
    {
        const parser = new MessengerHistoryParser();
        parser.flush();
        parser.parse(wrapper(w =>
        {
            w.writeInt(42); w.writeByte(1); w.writeInt(1); w.writeInt(900); w.writeInt(7);
            w.writeInt(0); w.writeString('hello'); w.writeString(''); w.writeInt(1234);
        }));
        expect(parser.conversationId).toBe(42);
        expect(parser.hasMore).toBe(true);
        expect(parser.messages[0]).toMatchObject({ id: 900, senderId: 7, message: 'hello' });
    });

    it('parses acknowledgement, failure, realtime message and read cursor', () =>
    {
        const ack = new MessengerMessageAckParser();
        ack.flush(); ack.parse(wrapper(w =>
        {
            w.writeInt(11); w.writeInt(42); w.writeInt(900); w.writeInt(1234);
        }));
        expect([ ack.confirmationId, ack.conversationId, ack.messageId, ack.createdAt ]).toEqual([ 11, 42, 900, 1234 ]);

        const failed = new MessengerMessageFailedParser();
        failed.flush(); failed.parse(wrapper(w =>
        {
            w.writeInt(11); w.writeInt(6);
        }));
        expect([ failed.confirmationId, failed.errorCode ]).toEqual([ 11, 6 ]);

        const realtime = new MessengerMessageParser();
        realtime.flush(); realtime.parse(wrapper(w =>
        {
            w.writeInt(42); w.writeInt(900); w.writeInt(7); w.writeInt(0); w.writeString('hello'); w.writeString(''); w.writeInt(1234);
        }));
        expect(realtime.message).toMatchObject({ conversationId: 42, id: 900 });

        const read = new MessengerReadCursorParser();
        read.flush(); read.parse(wrapper(w =>
        {
            w.writeInt(42); w.writeInt(7); w.writeInt(900);
        }));
        expect([ read.conversationId, read.readerId, read.messageId ]).toEqual([ 42, 7, 900 ]);
    });
});
