import { IMessageDataWrapper } from '@octane/api';

export class ConfInvisStateMessageData
{
    private _roomId: number;
    private _active: boolean;
    private _hiddenItemIds: number[];

    constructor(wrapper: IMessageDataWrapper)
    {
        this._roomId = wrapper.readInt();
        this._active = wrapper.readBoolean();

        const totalHiddenItems = wrapper.readInt();

        this._hiddenItemIds = [];

        for(let index = 0; index < totalHiddenItems; index++)
        {
            this._hiddenItemIds.push(wrapper.readInt());
        }
    }

    public get roomId(): number
    {
        return this._roomId;
    }

    public get hiddenItemIds(): number[]
    {
        return this._hiddenItemIds;
    }

    public get active(): boolean
    {
        return this._active;
    }
}
