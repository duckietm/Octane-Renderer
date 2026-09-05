import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface ISoundboardCatalogSound
{
    id: number;
    name: string;
    url: string;
    enabled: boolean;
    sortOrder: number;
    minRank: number;
    /** Key into gamedata/SoundData.json; empty for url-addressed pads. */
    classname: string;
}

export class SoundboardCatalogParser implements IMessageParser
{
    private static readonly MAX_SOUND_COUNT = 500;

    private _sounds: ISoundboardCatalogSound[] = [];

    public flush(): boolean
    {
        this._sounds = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._sounds = [];
        const count = wrapper.readInt();

        if(count < 0 || count > SoundboardCatalogParser.MAX_SOUND_COUNT) return false;

        for(let index = 0; index < count; index++)
        {
            this._sounds.push({
                id: wrapper.readInt(),
                name: wrapper.readString(),
                url: wrapper.readString(),
                enabled: wrapper.readBoolean(),
                sortOrder: wrapper.readInt(),
                minRank: wrapper.readInt(),
                classname: ''
            });
        }

        // Trailing block after the records — see SoundboardSettingsParser.
        if(!wrapper.bytesAvailable) return true;

        for(let index = 0; index < count; index++) this._sounds[index].classname = wrapper.readString();

        return true;
    }

    public get sounds(): ISoundboardCatalogSound[]
    {
        return this._sounds;
    }
}
