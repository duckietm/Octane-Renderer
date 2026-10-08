import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface ISoundboardSound
{
    id: number;
    name: string;
    url: string;
    /**
     * Key into gamedata/SoundData.json, which owns the audio file. Empty when
     * the pad is addressed by an explicit `url` instead, or when the server
     * predates asset-backed sounds.
     *
     * Optional so call sites that build a sound literal by hand (local
     * fallback catalogs, tests) do not have to carry a field the wire may not
     * even provide; the parser always sets it.
     */
    classname?: string;
}

export class SoundboardSettingsParser implements IMessageParser
{
    private _enabled: boolean = false;
    private _roomMode: number = 0;
    private _cooldownSeconds: number = 0;
    private _sounds: ISoundboardSound[] = [];

    public flush(): boolean
    {
        this._enabled = false;
        this._roomMode = 0;
        this._cooldownSeconds = 0;
        this._sounds = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._enabled = wrapper.readBoolean();
        this._roomMode = this._enabled ? 1 : 0;
        this._cooldownSeconds = Math.max(0, wrapper.readInt());
        const count = wrapper.readInt();
        this._sounds = [];

        if(count < 0 || count > 500) return false;

        for(let i = 0; i < count; i++)
        {
            this._sounds.push({
                id: wrapper.readInt(),
                name: wrapper.readString(),
                url: wrapper.readString(),
                classname: ''
            });
        }

        // Classnames arrive as their own block after the records, so one
        // check covers the whole optional tier. Never read an optional field
        // per record inside the loop above: on a server that does not emit it
        // the read steals bytes from the next record.
        if(!wrapper.bytesAvailable) return true;

        for(let i = 0; i < count; i++) this._sounds[i].classname = wrapper.readString();

        // The room mode closes the packet. A server that predates it only
        // knows on and off, which is what the boolean already said.
        if(wrapper.bytesAvailable) this._roomMode = wrapper.readInt();

        return true;
    }

    public get enabled(): boolean
    {
        return this._enabled;
    }
    /**
     * Who may use the soundboard in this room: 0 nobody, 1 everyone, 2 only
     * people with rights in the room.
     */
    public get roomMode(): number
    {
        return this._roomMode;
    }
    public get cooldownSeconds(): number
    {
        return this._cooldownSeconds;
    }
    public get sounds(): ISoundboardSound[]
    {
        return this._sounds;
    }
}
