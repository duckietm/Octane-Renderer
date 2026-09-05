import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface WiredFurniOpacityUpdate
{
    itemId: number;
    wallItem: boolean;
    opacity: number;
    clickThrough: boolean;
    easing: number;
    durationMs: number;
}

export class WiredFurniOpacityParser implements IMessageParser
{
    public static readonly PROTOCOL_VERSION = 1;
    public static readonly MAXIMUM_UPDATES = 1000;
    private static readonly HEADER_BYTES = 12;
    private static readonly UPDATE_BYTES = 18;

    private _protocolVersion = 0;
    private _roomId = 0;
    private _updates: WiredFurniOpacityUpdate[] = [];

    public flush(): boolean
    {
        this._protocolVersion = 0;
        this._roomId = 0;
        this._updates = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this.flush();
        if(!wrapper || !this.hasBytes(wrapper, WiredFurniOpacityParser.HEADER_BYTES)) return false;

        this._protocolVersion = wrapper.readInt();
        this._roomId = wrapper.readInt();
        const count = wrapper.readInt();

        if(this._protocolVersion !== WiredFurniOpacityParser.PROTOCOL_VERSION) return false;
        if((this._roomId < 0) || (count < 0) || (count > WiredFurniOpacityParser.MAXIMUM_UPDATES)) return false;
        if(!this.hasBytes(wrapper, count * WiredFurniOpacityParser.UPDATE_BYTES)) return false;

        const updates: WiredFurniOpacityUpdate[] = [];

        for(let index = 0; index < count; index++)
        {
            const itemId = wrapper.readInt();
            const wallItem = wrapper.readBoolean();
            const opacity = wrapper.readInt();
            const clickThrough = wrapper.readBoolean();
            const easing = wrapper.readInt();
            const durationMs = wrapper.readInt();

            if(itemId <= 0) return false;

            updates.push({
                itemId,
                wallItem,
                opacity: Math.max(0, Math.min(100, opacity)),
                clickThrough,
                easing: Math.max(0, Math.min(4, easing)),
                durationMs: Math.max(0, Math.min(10000, durationMs))
            });
        }

        this._updates = updates;
        return true;
    }

    private hasBytes(wrapper: IMessageDataWrapper, required: number): boolean
    {
        if(required <= 0) return true;
        if(typeof wrapper.remainingBytes === 'number') return wrapper.remainingBytes >= required;
        return wrapper.bytesAvailable;
    }

    public get protocolVersion(): number
    {
        return this._protocolVersion;
    }

    public get roomId(): number
    {
        return this._roomId;
    }

    public get updates(): readonly WiredFurniOpacityUpdate[]
    {
        return this._updates;
    }
}
