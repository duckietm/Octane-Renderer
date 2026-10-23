import { IBinaryWriter } from '@octane/api';

export class BinaryWriter implements IBinaryWriter
{
    private static readonly TEXT_ENCODER = new TextEncoder();
    private static readonly INITIAL_CAPACITY = 64;

    // `_buffer` is spare capacity; only the first `_length` bytes have been written.
    private _buffer: Uint8Array;
    private _length: number;
    private _position: number;

    constructor()
    {
        this._buffer = new Uint8Array(BinaryWriter.INITIAL_CAPACITY);
        this._length = 0;
        this._position = 0;
    }

    public writeByte(byte: number): IBinaryWriter
    {
        const array = new Uint8Array(1);

        array[0] = byte;

        this.appendArray(array);

        return this;
    }

    public writeBytes(bytes: ArrayBuffer | number[]): IBinaryWriter
    {
        const array = new Uint8Array(bytes);

        this.appendArray(array);

        return this;
    }

    public writeShort(short: number): IBinaryWriter
    {
        const array = new Uint8Array(2);

        array[0] = short >> 8;
        array[1] = short & 0xFF;

        this.appendArray(array);

        return this;
    }

    public writeInt(integer: number): IBinaryWriter
    {
        const array = new Uint8Array(4);

        array[0] = integer >> 24;
        array[1] = integer >> 16;
        array[2] = integer >> 8;
        array[3] = integer & 0xFF;

        this.appendArray(array);

        return this;
    }

    public writeString(string: string, includeLength: boolean = true): IBinaryWriter
    {
        const array = BinaryWriter.TEXT_ENCODER.encode(string);

        if(includeLength)
        {
            this.writeShort(array.length);
            this.appendArray(array);
        }
        else
        {
            this.appendArray(array);
        }

        return this;
    }

    private appendArray(array: Uint8Array): void
    {
        if(!array) return;

        const end = this.position + array.length;

        if(end > this._buffer.length)
        {
            const grown = new Uint8Array(Math.max(end, this._buffer.length * 2));

            grown.set(this._buffer.subarray(0, this._length));

            this._buffer = grown;
        }

        this._buffer.set(array, this.position);

        if(end > this._length) this._length = end;

        this.position = end;
    }

    public getBuffer(): ArrayBuffer
    {
        return this._buffer.slice(0, this._length).buffer;
    }

    public get position(): number
    {
        return this._position;
    }

    public set position(pos: number)
    {
        this._position = pos;
    }

    public toString(encoding?: string): string
    {
        return new TextDecoder(encoding).decode(this._buffer.subarray(0, this._length));
    }
}
