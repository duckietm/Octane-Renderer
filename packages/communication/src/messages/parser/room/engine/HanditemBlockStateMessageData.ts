import { IMessageDataWrapper } from '@octane/api';

export class HanditemBlockStateMessageData
{
    private _roomId: number;
    private _blocked: boolean;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._roomId = wrapper.readInt();
        this._blocked = wrapper.readBoolean();
    }

    public get roomId(): number
    {
        return this._roomId;
    }

    public get blocked(): boolean
    {
        return this._blocked;
    }
}
