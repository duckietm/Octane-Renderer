import { IMessageComposer } from '@octane/api';

export class GetOfficialSongIdMessageComposer implements IMessageComposer<ConstructorParameters<typeof GetOfficialSongIdMessageComposer>>
{
    private _data: ConstructorParameters<typeof GetOfficialSongIdMessageComposer>;

    constructor(officialSongCode: string)
    {
        this._data = [officialSongCode];
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
