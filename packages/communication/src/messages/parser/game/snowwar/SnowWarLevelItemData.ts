import { IMessageDataWrapper } from '@octane/api';

export class SnowWarLevelItemData
{
    private _name: string;
    private _x: number;
    private _y: number;
    private _rotation: number;
    private _imageUrl: string;
    private _offsetZ: number;
    private _walkableHeight: number;
    private _width: number;
    private _length: number;
    private _state: number;
    private _stateCount: number;

    constructor(wrapper: IMessageDataWrapper)
    {
        this._name = wrapper.readString();
        this._x = wrapper.readInt();
        this._y = wrapper.readInt();
        this._rotation = wrapper.readInt();
        // Optional room-ad image (empty for normal props) + its vertical
        // backdrop offset, then the server-derived walkable height (0 = you can
        // walk over it, >0 = it blocks the tile) and the furni footprint in
        // tiles (unrotated width/length). Trailing per-item fields, guarded by
        // the item count (not bytesAvailable). MUST stay in sync with
        // SnowStormLevelDataComposer - the server appends all five here.
        this._imageUrl = wrapper.readString();
        this._offsetZ = wrapper.readInt();
        this._walkableHeight = wrapper.readInt();
        this._width = wrapper.readInt();
        this._length = wrapper.readInt();
        // Multistate furni state index (0 for single-state props), then the
        // furni's total number of interaction states
        // (items_base.interaction_modes_count) so the editor can cap the state
        // stepper. Last two per-item fields; MUST stay in sync with
        // SnowStormLevelDataComposer.
        this._state = wrapper.readInt();
        this._stateCount = wrapper.readInt();
    }

    public get name(): string
    {
        return this._name;
    }

    public get x(): number
    {
        return this._x;
    }

    public get y(): number
    {
        return this._y;
    }

    public get rotation(): number
    {
        return this._rotation;
    }

    public get imageUrl(): string
    {
        return this._imageUrl;
    }

    public get offsetZ(): number
    {
        return this._offsetZ;
    }

    public get walkableHeight(): number
    {
        return this._walkableHeight;
    }

    public get width(): number
    {
        return this._width;
    }

    public get length(): number
    {
        return this._length;
    }

    public get state(): number
    {
        return this._state;
    }

    public get stateCount(): number
    {
        return this._stateCount;
    }
}
