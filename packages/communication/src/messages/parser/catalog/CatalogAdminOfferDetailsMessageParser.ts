import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';

export class CatalogAdminOfferDetailsMessageParser implements IMessageParser
{
    private _offerId: number;
    private _pageId: number;
    private _itemIds: string;
    private _catalogName: string;
    private _costCredits: number;
    private _costPoints: number;
    private _pointsType: number;
    private _amount: number;
    private _clubOnly: boolean;
    private _extradata: string;
    private _haveOffer: boolean;
    private _offerIdGroup: number;
    private _limitedStack: number;
    private _limitedSells: number;
    private _orderNumber: number;
    private _songId: number;
    private _catalogMode: string;

    public flush(): boolean
    {
        this._offerId = -1;
        this._pageId = -1;
        this._itemIds = '';
        this._catalogName = '';
        this._costCredits = 0;
        this._costPoints = 0;
        this._pointsType = 0;
        this._amount = 1;
        this._clubOnly = false;
        this._extradata = '';
        this._haveOffer = true;
        this._offerIdGroup = 0;
        this._limitedStack = 0;
        this._limitedSells = 0;
        this._orderNumber = 0;
        this._songId = 0;
        this._catalogMode = 'NORMAL';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._offerId = wrapper.readInt();
        this._pageId = wrapper.readInt();
        this._itemIds = wrapper.readString();
        this._catalogName = wrapper.readString();
        this._costCredits = wrapper.readInt();
        this._costPoints = wrapper.readInt();
        this._pointsType = wrapper.readInt();
        this._amount = wrapper.readInt();
        this._clubOnly = wrapper.readBoolean();
        this._extradata = wrapper.readString();
        this._haveOffer = wrapper.readBoolean();
        this._offerIdGroup = wrapper.readInt();
        this._limitedStack = wrapper.readInt();
        this._limitedSells = wrapper.readInt();
        this._orderNumber = wrapper.readInt();
        this._songId = wrapper.readInt();
        this._catalogMode = wrapper.readString();

        return true;
    }

    public get offerId(): number
    {
        return this._offerId;
    }
    public get pageId(): number
    {
        return this._pageId;
    }
    public get itemIds(): string
    {
        return this._itemIds;
    }
    public get catalogName(): string
    {
        return this._catalogName;
    }
    public get costCredits(): number
    {
        return this._costCredits;
    }
    public get costPoints(): number
    {
        return this._costPoints;
    }
    public get pointsType(): number
    {
        return this._pointsType;
    }
    public get amount(): number
    {
        return this._amount;
    }
    public get clubOnly(): boolean
    {
        return this._clubOnly;
    }
    public get extradata(): string
    {
        return this._extradata;
    }
    public get haveOffer(): boolean
    {
        return this._haveOffer;
    }
    public get offerIdGroup(): number
    {
        return this._offerIdGroup;
    }
    public get limitedStack(): number
    {
        return this._limitedStack;
    }
    public get limitedSells(): number
    {
        return this._limitedSells;
    }
    public get orderNumber(): number
    {
        return this._orderNumber;
    }
    public get songId(): number
    {
        return this._songId;
    }
    public get catalogMode(): string
    {
        return this._catalogMode;
    }
}
