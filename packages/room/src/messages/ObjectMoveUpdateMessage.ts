import { IRoomObjectController, IVector3D } from '@octane/api';
import { RoomObjectUpdateMessage } from './RoomObjectUpdateMessage';

export class ObjectMoveUpdateMessage extends RoomObjectUpdateMessage
{
    public static DEFAULT_DURATION: number = 500;

    private _targetLocation: IVector3D;
    private _isSlide: boolean;
    private _duration: number;
    private _elapsed: number;
    private _anchorObject: IRoomObjectController;
    private _anchorOffset: IVector3D;

    constructor(location: IVector3D, targetLocation: IVector3D, direction: IVector3D, isSlide: boolean = false, duration: number = ObjectMoveUpdateMessage.DEFAULT_DURATION, elapsed: number = 0, anchorObject: IRoomObjectController = null, anchorOffset: IVector3D = null)
    {
        super(location, direction);

        this._targetLocation = targetLocation;
        this._isSlide = isSlide;
        this._duration = duration;
        this._elapsed = elapsed;
        this._anchorObject = anchorObject;
        this._anchorOffset = anchorOffset;
    }

    public get targetLocation(): IVector3D
    {
        if(!this._targetLocation) return this.location;

        return this._targetLocation;
    }

    public get isSlide(): boolean
    {
        return this._isSlide;
    }

    public get duration(): number
    {
        return this._duration;
    }

    public get elapsed(): number
    {
        return this._elapsed;
    }

    public get anchorObject(): IRoomObjectController
    {
        return this._anchorObject;
    }

    public get anchorOffset(): IVector3D
    {
        return this._anchorOffset;
    }
}
