import { IBinaryReader, IMessageDataWrapper } from '@octane/api';

export class EvaWireDataWrapper implements IMessageDataWrapper
{
    private _header: number;
    private _buffer: IBinaryReader;

    constructor(header: number, buffer: IBinaryReader)
    {
        this._header = header;
        this._buffer = buffer;
    }

    public readBytes(length: number): IBinaryReader
    {
        if(!this._buffer) return null;

        return this._buffer.readBytes(length);
    }

    public readByte(): number
    {
        if(!this._buffer) return -1;

        return this._buffer.readByte();
    }

    public readBoolean(): boolean
    {
        return (this.readByte() === 1);
    }

    public readShort(): number
    {
        if(!this._buffer) return -1;

        return this._buffer.readShort();
    }

    public readInt(): number
    {
        if(!this._buffer) return -1;

        return this._buffer.readInt();
    }

    public readFloat(): number
    {
        if(!this._buffer) return -1;

        return this._buffer.readFloat();
    }

    public readDouble(): number
    {
        if(!this._buffer) return -1;

        return this._buffer.readDouble();
    }

    public readString(): string
    {
        if(!this._buffer) return '';

        // The length is an unsigned short, as Polaris writes it: read signed, a string of 32768 to
        // 65535 bytes (wired JSON, large heightmaps) came out negative and misread the whole packet.
        const length = (this._buffer.readShort() & 0xFFFF);
        const buffer = this._buffer.readBytes(length);

        return buffer.toString('utf8');
    }

    public get header(): number
    {
        return this._header;
    }

    public get bytesAvailable(): boolean
    {
        return (this._buffer && (this._buffer.remaining() > 0));
    }

    public get remainingBytes(): number
    {
        return this._buffer?.remaining() ?? 0;
    }
}
