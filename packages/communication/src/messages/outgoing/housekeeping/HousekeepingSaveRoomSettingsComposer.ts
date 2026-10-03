import { IMessageComposer } from '@octane/api';

export class HousekeepingSaveRoomSettingsComposer implements IMessageComposer<(string | number)[]>
{
    private _data: (string | number)[];

    constructor(roomId: number, name: string, description: string, usersMax: number, categoryId: number, tradeMode: number, tags: string[])
    {
        this._data = [roomId, name, description, usersMax, categoryId, tradeMode, tags.length];

        for(const tag of tags) this._data.push(tag);
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
