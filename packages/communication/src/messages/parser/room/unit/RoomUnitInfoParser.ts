import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class RoomUnitInfoParser implements IMessageParser
{
    private _unitId: number;
    private _figure: string;
    private _gender: string;
    private _motto: string;
    private _achievementScore: number;
    private _backgroundId: number;
    private _standId: number;
    private _overlayId: number;
    private _cardBackgroundId: number;
    private _borderId: number;
    private _nickIcon: string;
    private _prefixText: string;
    private _prefixColor: string;
    private _prefixIcon: string;
    private _prefixEffect: string;
    private _prefixFont: string;
    private _displayOrder: string;

    public flush(): boolean
    {
        this._unitId = null;
        this._figure = null;
        this._gender = 'M';
        this._motto = null;
        this._achievementScore = 0;
        this._backgroundId = 0;
        this._standId = 0;
        this._overlayId = 0;
        this._cardBackgroundId = 0;
        this._borderId = 0;
        this._nickIcon = '';
        this._prefixText = '';
        this._prefixColor = '';
        this._prefixIcon = '';
        this._prefixEffect = '';
        this._prefixFont = '';
        this._displayOrder = 'icon-prefix-name';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._unitId = wrapper.readInt();
        this._figure = wrapper.readString();
        this._gender = wrapper.readString().toLocaleUpperCase();
        this._motto = wrapper.readString();
        this._achievementScore = wrapper.readInt();
        this._backgroundId = wrapper.readInt();
        this._standId = wrapper.readInt();
        this._overlayId = wrapper.readInt();
        this._cardBackgroundId = (wrapper.bytesAvailable ? wrapper.readInt() : 0);
        this._nickIcon = (wrapper.bytesAvailable ? wrapper.readString() : '');
        this._prefixText = (wrapper.bytesAvailable ? wrapper.readString() : '');
        this._prefixColor = (wrapper.bytesAvailable ? wrapper.readString() : '');
        this._prefixIcon = (wrapper.bytesAvailable ? wrapper.readString() : '');
        this._prefixEffect = (wrapper.bytesAvailable ? wrapper.readString() : '');
        this._prefixFont = (wrapper.bytesAvailable ? wrapper.readString() : '');
        this._displayOrder = (wrapper.bytesAvailable ? wrapper.readString() : 'icon-prefix-name');
        this._borderId = (wrapper.bytesAvailable ? wrapper.readInt() : 0);

        return true;
    }

    public get unitId(): number
    {
        return this._unitId;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public get gender(): string
    {
        return this._gender;
    }

    public get motto(): string
    {
        return this._motto;
    }

    public get achievementScore(): number
    {
        return this._achievementScore;
    }

    public get backgroundId(): number
    {
        return this._backgroundId;
    }

    public get standId(): number
    {
        return this._standId;
    }

    public get overlayId(): number
    {
        return this._overlayId;
    }

    public get cardBackgroundId(): number
    {
        return this._cardBackgroundId;
    }

    public get borderId(): number
    {
        return this._borderId;
    }

    public get nickIcon(): string
    {
        return this._nickIcon;
    }

    public get prefixText(): string
    {
        return this._prefixText;
    }

    public get prefixColor(): string
    {
        return this._prefixColor;
    }

    public get prefixIcon(): string
    {
        return this._prefixIcon;
    }

    public get prefixEffect(): string
    {
        return this._prefixEffect;
    }

    public get prefixFont(): string
    {
        return this._prefixFont;
    }

    public get displayOrder(): string
    {
        return this._displayOrder;
    }
}
