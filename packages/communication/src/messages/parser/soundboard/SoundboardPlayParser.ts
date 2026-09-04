import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class SoundboardPlayParser implements IMessageParser
{
    private _soundId: number = 0;
    private _url: string = '';
    private _soundName: string = '';
    private _actorUserId: number = 0;
    private _actorRoomIndex: number = 0;
    private _username: string = '';
    private _classname: string = '';

    public flush(): boolean
    {
        this._soundId = 0;
        this._url = '';
        this._soundName = '';
        this._actorUserId = 0;
        this._actorRoomIndex = 0;
        this._username = '';
        this._classname = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._soundId = wrapper.readInt();
        this._url = wrapper.readString();
        this._soundName = wrapper.readString();
        this._actorUserId = wrapper.readInt();
        this._actorRoomIndex = wrapper.readInt();
        this._username = wrapper.readString();

        // Single record, so a plain trailing field is safe here.
        if(!wrapper.bytesAvailable) return true;

        this._classname = wrapper.readString();

        return true;
    }

    public get soundId(): number
    {
        return this._soundId;
    }
    public get url(): string
    {
        return this._url;
    }
    public get soundName(): string
    {
        return this._soundName;
    }
    public get actorUserId(): number
    {
        return this._actorUserId;
    }
    public get actorRoomIndex(): number
    {
        return this._actorRoomIndex;
    }
    public get username(): string
    {
        return this._username;
    }
    public get classname(): string
    {
        return this._classname;
    }
}
