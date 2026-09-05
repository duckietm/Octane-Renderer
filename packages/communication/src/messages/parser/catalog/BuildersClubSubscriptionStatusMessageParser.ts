import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class BuildersClubSubscriptionStatusMessageParser implements IMessageParser
{
    private _secondsLeft: number;
    private _furniLimit: number;
    private _maxFurniLimit: number;
    private _secondsLeftWithGrace: number;
    private _placementBlockedByVisitors: boolean;
    private _placementAllowedInCurrentRoom: boolean;

    public flush(): boolean
    {
        this._secondsLeft = 0;
        this._furniLimit = 0;
        this._maxFurniLimit = 0;
        this._secondsLeftWithGrace = 0;
        this._placementBlockedByVisitors = false;
        this._placementAllowedInCurrentRoom = false;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._secondsLeft = wrapper.readInt();
        this._furniLimit = wrapper.readInt();
        this._maxFurniLimit = wrapper.readInt();

        if(wrapper.bytesAvailable) this._secondsLeftWithGrace = wrapper.readInt();
        else this._secondsLeftWithGrace = this._secondsLeft;

        if(wrapper.bytesAvailable) this._placementBlockedByVisitors = wrapper.readBoolean();
        else this._placementBlockedByVisitors = false;

        if(wrapper.bytesAvailable) this._placementAllowedInCurrentRoom = wrapper.readBoolean();
        else this._placementAllowedInCurrentRoom = false;

        return true;
    }

    public get secondsLeft(): number
    {
        return this._secondsLeft;
    }

    public get furniLimit(): number
    {
        return this._furniLimit;
    }

    public get maxFurniLimit(): number
    {
        return this._maxFurniLimit;
    }

    public get secondsLeftWithGrace(): number
    {
        return this._secondsLeftWithGrace;
    }

    public get placementBlockedByVisitors(): boolean
    {
        return this._placementBlockedByVisitors;
    }

    public get placementAllowedInCurrentRoom(): boolean
    {
        return this._placementAllowedInCurrentRoom;
    }
}
