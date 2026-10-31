import { IBinaryWriter, ICodec, IConnection, IMessageDataWrapper } from '@octane/api';
import { BinaryReader, BinaryWriter } from '@octane/utils';
import { Byte } from '../Byte';
import { Short } from '../Short';
import { EvaWireDataWrapper } from './EvaWireDataWrapper';

/** A message length the protocol cannot have; the stream can't be read past it. */
export class InvalidMessageLengthError extends Error
{
    constructor(public readonly length: number)
    {
        super(`Invalid message length ${ length }`);
    }
}

export class EvaWireFormat implements ICodec
{
    /** Every message carries at least its 2-byte header; the upper bound stops a bad length from growing the buffer forever. */
    public static MIN_MESSAGE_LENGTH: number = 2;
    public static MAX_MESSAGE_LENGTH: number = (8 * 1024 * 1024);

    public static isValidMessageLength(length: number): boolean
    {
        return (length >= EvaWireFormat.MIN_MESSAGE_LENGTH) && (length <= EvaWireFormat.MAX_MESSAGE_LENGTH);
    }

    public encode(header: number, messages: any[]): IBinaryWriter
    {
        try
        {
            return this.encodeMessage(header, messages);
        }

        catch (error)
        {
            // A value that cannot be written (a string past 65535 bytes) drops this packet, not the whole send.
            if(error instanceof RangeError) return null;

            throw error;
        }
    }

    private encodeMessage(header: number, messages: any[]): IBinaryWriter
    {
        const writer = new BinaryWriter();

        writer.writeShort(header);

        for(const value of messages)
        {
            let type: string = typeof value;

            if(type === 'object')
            {
                if(value === null) type = 'null';
                else if(value instanceof Byte) type = 'byte';
                else if(value instanceof Short) type = 'short';
                else if(value instanceof ArrayBuffer) type = 'arraybuffer';
            }

            switch(type)
            {
                case 'undefined':
                    // A missing optional argument went out as a 2-byte empty string even where the server reads an int
                    // or a boolean, shifting every field after it. The packet is dropped instead.
                    throw new RangeError(`Message ${ header }: a field is undefined`);
                case 'null':
                    writer.writeShort(0);
                    break;
                case 'byte':
                    writer.writeByte(value.value);
                    break;
                case 'short':
                    writer.writeShort(value.value);
                    break;
                case 'number':
                    writer.writeInt(value);
                    break;
                case 'boolean':
                    writer.writeByte(value ? 1 : 0);
                    break;
                case 'string':
                    if(!value) writer.writeShort(0);
                    else
                    {
                        writer.writeString(value, true);
                    }
                    break;
                case 'arraybuffer':
                    writer.writeBytes(value);
                    break;
            }
        }

        const buffer = writer.getBuffer();

        if(!buffer) return null;

        return new BinaryWriter().writeInt(buffer.byteLength).writeBytes(buffer);
    }

    public decode(connection: IConnection): IMessageDataWrapper[]
    {
        if(!connection || !connection.dataBuffer || !connection.dataBuffer.byteLength) return null;

        const buffer = connection.dataBuffer;
        const totalLength = buffer.byteLength;
        const dataView = new DataView(buffer);
        const wrappers: IMessageDataWrapper[] = [];
        let offset = 0;

        while(offset + 4 <= totalLength)
        {
            const length = dataView.getInt32(offset);

            if(!EvaWireFormat.isValidMessageLength(length)) throw new InvalidMessageLengthError(length);

            if((offset + 4 + length) > totalLength) break;

            const bodyStart = offset + 4;
            const body = new BinaryReader(buffer.slice(bodyStart, bodyStart + length));

            wrappers.push(new EvaWireDataWrapper(body.readShort(), body));

            offset = bodyStart + length;
        }

        connection.dataBuffer = (offset >= totalLength) ? new ArrayBuffer(0) : buffer.slice(offset);

        return wrappers;
    }
}
