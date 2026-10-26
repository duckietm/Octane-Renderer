import { IBinaryReader } from '@octane/api';

export class BinaryReader implements IBinaryReader
{
    private static readonly TEXT_DECODER = new TextDecoder();

    private _position: number;
    private _dataView: DataView;

    constructor(buffer: ArrayBuffer)
    {
        this._position = 0;
        this._dataView = new DataView(buffer);
    }

    public readBytes(length: number): IBinaryReader
    {
        // Never past the end nor backwards: a bad length used to move the position out of the buffer.
        const count = Math.max(0, Math.min(length | 0, this.remaining()));
        const buffer = new BinaryReader(this._dataView.buffer.slice(this._position, this._position + count) as ArrayBuffer);

        this._position += count;

        return buffer;
    }

    public readByte(): number
    {
        const byte = this._dataView.getInt8(this._position);

        this._position++;

        return byte;
    }

    public readShort(): number
    {
        const short = this._dataView.getInt16(this._position);

        this._position += 2;

        return short;
    }

    public readInt(): number
    {
        const int = this._dataView.getInt32(this._position);

        this._position += 4;

        return int;
    }

    public readFloat(): number
    {
        const float = this._dataView.getFloat32(this._position);

        this._position += 4;

        return float;
    }

    public readDouble(): number
    {
        const double = this._dataView.getFloat64(this._position);

        this._position += 8;

        return double;
    }

    public remaining(): number
    {
        return this._dataView.byteLength - this._position;
    }

    public toString(encoding?: string): string
    {
        return BinaryReader.TEXT_DECODER.decode(this._dataView.buffer);
    }

    public toArrayBuffer(): ArrayBuffer
    {
        return this._dataView.buffer as ArrayBuffer;
    }
}
