import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface INickIconData
{
    iconKey: string;
    displayName: string;
    points: number;
    pointsType: number;
    owned: boolean;
    active: boolean;
    id: number;
}

export interface ICustomizePrefixCatalogData
{
    id: number;
    displayName: string;
    text: string;
    color: string;
    icon: string;
    effect: string;
    font: string;
    points: number;
    pointsType: number;
    owned: boolean;
    active: boolean;
    ownedPrefixId: number;
}

export interface ICustomizeOwnedPrefixData
{
    id: number;
    displayName: string;
    text: string;
    color: string;
    icon: string;
    effect: string;
    font: string;
    active: boolean;
    isCustom: boolean;
    points: number;
    pointsType: number;
    catalogPrefixId: number;
}

export class UserNickIconsParser implements IMessageParser
{
    private _nickIcons: INickIconData[];
    private _displayOrder: string;
    private _customPrefixMaxLength: number;
    private _customPrefixPriceCredits: number;
    private _customPrefixPricePoints: number;
    private _customPrefixPointsType: number;
    private _customPrefixFontPriceCredits: number;
    private _customPrefixFontPricePoints: number;
    private _customPrefixFontPointsType: number;
    private _prefixCatalog: ICustomizePrefixCatalogData[];
    private _ownedPrefixes: ICustomizeOwnedPrefixData[];

    public flush(): boolean
    {
        this._nickIcons = [];
        this._displayOrder = 'icon-prefix-name';
        this._customPrefixMaxLength = 15;
        this._customPrefixPriceCredits = 0;
        this._customPrefixPricePoints = 0;
        this._customPrefixPointsType = 0;
        this._customPrefixFontPriceCredits = 0;
        this._customPrefixFontPricePoints = 0;
        this._customPrefixFontPointsType = 0;
        this._prefixCatalog = [];
        this._ownedPrefixes = [];
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._nickIcons = [];
        this._displayOrder = 'icon-prefix-name';
        this._customPrefixMaxLength = 15;
        this._customPrefixPriceCredits = 0;
        this._customPrefixPricePoints = 0;
        this._customPrefixPointsType = 0;
        this._customPrefixFontPriceCredits = 0;
        this._customPrefixFontPricePoints = 0;
        this._customPrefixFontPointsType = 0;
        this._prefixCatalog = [];
        this._ownedPrefixes = [];

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._nickIcons.push({
                iconKey: wrapper.readString(),
                displayName: wrapper.readString(),
                points: wrapper.readInt(),
                pointsType: wrapper.readInt(),
                owned: (wrapper.readInt() === 1),
                active: (wrapper.readInt() === 1),
                id: wrapper.readInt()
            });

            count--;
        }

        if(wrapper.bytesAvailable)
        {
            this._displayOrder = wrapper.readString();
            this._customPrefixMaxLength = wrapper.readInt();
            this._customPrefixPriceCredits = wrapper.readInt();
            this._customPrefixPricePoints = wrapper.readInt();
            this._customPrefixPointsType = wrapper.readInt();
            this._customPrefixFontPriceCredits = wrapper.readInt();
            this._customPrefixFontPricePoints = wrapper.readInt();
            this._customPrefixFontPointsType = wrapper.readInt();

            let catalogCount = wrapper.readInt();

            while(catalogCount > 0)
            {
                this._prefixCatalog.push({
                    id: wrapper.readInt(),
                    displayName: wrapper.readString(),
                    text: wrapper.readString(),
                    color: wrapper.readString(),
                    icon: wrapper.readString(),
                    effect: wrapper.readString(),
                    font: wrapper.readString(),
                    points: wrapper.readInt(),
                    pointsType: wrapper.readInt(),
                    owned: (wrapper.readInt() === 1),
                    active: (wrapper.readInt() === 1),
                    ownedPrefixId: wrapper.readInt()
                });

                catalogCount--;
            }

            let ownedCount = wrapper.readInt();

            while(ownedCount > 0)
            {
                this._ownedPrefixes.push({
                    id: wrapper.readInt(),
                    displayName: wrapper.readString(),
                    text: wrapper.readString(),
                    color: wrapper.readString(),
                    icon: wrapper.readString(),
                    effect: wrapper.readString(),
                    font: wrapper.readString(),
                    active: (wrapper.readInt() === 1),
                    isCustom: (wrapper.readInt() === 1),
                    points: wrapper.readInt(),
                    pointsType: wrapper.readInt(),
                    catalogPrefixId: wrapper.readInt()
                });

                ownedCount--;
            }
        }

        return true;
    }

    public get nickIcons(): INickIconData[]
    {
        return this._nickIcons;
    }

    public get displayOrder(): string
    {
        return this._displayOrder;
    }

    public get customPrefixMaxLength(): number
    {
        return this._customPrefixMaxLength;
    }

    public get customPrefixPriceCredits(): number
    {
        return this._customPrefixPriceCredits;
    }

    public get customPrefixPricePoints(): number
    {
        return this._customPrefixPricePoints;
    }

    public get customPrefixPointsType(): number
    {
        return this._customPrefixPointsType;
    }

    public get customPrefixFontPriceCredits(): number
    {
        return this._customPrefixFontPriceCredits;
    }

    public get customPrefixFontPricePoints(): number
    {
        return this._customPrefixFontPricePoints;
    }

    public get customPrefixFontPointsType(): number
    {
        return this._customPrefixFontPointsType;
    }

    public get prefixCatalog(): ICustomizePrefixCatalogData[]
    {
        return this._prefixCatalog;
    }

    public get ownedPrefixes(): ICustomizeOwnedPrefixData[]
    {
        return this._ownedPrefixes;
    }
}
