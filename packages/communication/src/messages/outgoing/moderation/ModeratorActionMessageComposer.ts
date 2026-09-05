import { IMessageComposer } from '@octane/api';

export class ModeratorActionMessageComposer implements IMessageComposer<any>
{
    public static readonly ACTION_ALERT = 0;
    public static readonly ACTION_KICK = 1;
    public static readonly ACTION_MESSAGE = 3;
    public static readonly ACTION_MESSAGE_AND_SOFT_KICK = 4;

    private _data: any[] = [];

    constructor(actionType: number, message: string, caption: string)
    {
        this._data.push(actionType);
        this._data.push(message);
        this._data.push(caption);
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
