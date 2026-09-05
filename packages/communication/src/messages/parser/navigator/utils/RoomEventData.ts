import { IMessageDataWrapper } from '@octane/api';

export class RoomEventData
{
    private _adId: number;
    private _ownerAvatarId: number;
    private _ownerAvatarName: string;
    private _flatId: number;
    private _categoryId: number;
    private _eventType: number;
    private _eventName: string;
    private _eventDescription: string;
    private _creationTime: string;
    private _expirationDate: Date;
    private _disposed: boolean;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._adId = wrapper.readInt();
        this._ownerAvatarId = wrapper.readInt();
        this._ownerAvatarName = wrapper.readString();
        this._flatId = wrapper.readInt();
        this._eventType = wrapper.readInt();
        this._eventName = wrapper.readString();
        this._eventDescription = wrapper.readString();
        const minutesSinceCreation = wrapper.readInt();
        const minutesUntilExpiration = wrapper.readInt();
        const now: Date = new Date();
        let creationTimeMs = now.getTime();
        const creationOffsetMs = ((minutesSinceCreation * 60) * 1000);
        creationTimeMs = (creationTimeMs - creationOffsetMs);
        const creationDate: Date = new Date(creationTimeMs);
        this._creationTime = ((((((((creationDate.getDate() + '-') + creationDate.getMonth()) + '-') + creationDate.getFullYear()) + ' ') + creationDate.getHours()) + ':') + creationDate.getMinutes());
        let expirationTimeMs = now.getTime();
        const expirationOffsetMs = ((minutesUntilExpiration * 60) * 1000);
        expirationTimeMs = (expirationTimeMs + expirationOffsetMs);
        this._expirationDate = new Date(expirationTimeMs);
        this._categoryId = wrapper.readInt();
    }

    public dispose(): void
    {
        if(this._disposed)
        {
            return;
        }
        this._disposed = true;
    }

    public get disposed(): boolean
    {
        return this._disposed;
    }

    public get adId(): number
    {
        return this._adId;
    }

    public get ownerAvatarId(): number
    {
        return this._ownerAvatarId;
    }

    public get ownerAvatarName(): string
    {
        return this._ownerAvatarName;
    }

    public get flatId(): number
    {
        return this._flatId;
    }

    public get categoryId(): number
    {
        return this._categoryId;
    }

    public get eventType(): number
    {
        return this._eventType;
    }

    public get eventName(): string
    {
        return this._eventName;
    }

    public get eventDescription(): string
    {
        return this._eventDescription;
    }

    public get creationTime(): string
    {
        return this._creationTime;
    }

    public get expirationDate(): Date
    {
        return this._expirationDate;
    }
}
