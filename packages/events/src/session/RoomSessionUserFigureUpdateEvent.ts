import { IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';

export class RoomSessionUserFigureUpdateEvent extends RoomSessionEvent
{
    public static USER_FIGURE: string = 'RSUBE_FIGURE';

    private _roomIndex: number = 0;
    private _figure: string = '';
    private _gender: string = '';
    private _customInfo: string = '';
    private _achievementScore: number;
    private _backgroundId: number | null;
    private _standId: number | null;
    private _overlayId: number | null;
    private _cardBackgroundId: number | null;
    private _nickIcon: string;
    private _prefixText: string;
    private _prefixColor: string;
    private _prefixIcon: string;
    private _prefixEffect: string;
    private _prefixFont: string;
    private _displayOrder: string;
    private _borderId: number | null;

    constructor(
        session: IRoomSession,
        roomIndex: number,
        figure: string,
        gender: string,
        customInfo: string,
        achievementScore: number,
        backgroundId: number | null,
        standId: number | null,
        overlayId: number | null,
        cardBackgroundId: number | null = 0,
        nickIcon: string = '',
        prefixText: string = '',
        prefixColor: string = '',
        prefixIcon: string = '',
        prefixEffect: string = '',
        prefixFont: string = '',
        displayOrder: string = 'icon-prefix-name',
        borderId: number | null = 0
    )
    {
        super(RoomSessionUserFigureUpdateEvent.USER_FIGURE, session);

        this._roomIndex = roomIndex;
        this._figure = figure;
        this._gender = gender;
        this._customInfo = customInfo;
        this._achievementScore = achievementScore;
        this._backgroundId = backgroundId;
        this._standId = standId;
        this._overlayId = overlayId;
        this._cardBackgroundId = cardBackgroundId;
        this._nickIcon = nickIcon;
        this._prefixText = prefixText;
        this._prefixColor = prefixColor;
        this._prefixIcon = prefixIcon;
        this._prefixEffect = prefixEffect;
        this._prefixFont = prefixFont;
        this._displayOrder = displayOrder;
        this._borderId = borderId;
    }

    public get roomIndex(): number
    {
        return this._roomIndex;
    }

    public get figure(): string
    {
        return this._figure;
    }

    public get gender(): string
    {
        return this._gender;
    }

    public get customInfo(): string
    {
        return this._customInfo;
    }

    public get activityPoints(): number
    {
        return this._achievementScore;
    }

    public get backgroundId(): number | null
    {
        return this._backgroundId;
    }

    public get standId(): number | null
    {
        return this._standId;
    }

    public get overlayId(): number | null
    {
        return this._overlayId;
    }

    public get cardBackgroundId(): number | null
    {
        return this._cardBackgroundId;
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

    public get borderId(): number | null
    {
        return this._borderId;
    }
}
