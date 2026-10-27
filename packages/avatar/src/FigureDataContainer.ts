export class FigureDataContainer
{
    public static MALE: string = 'M';
    public static FEMALE: string = 'F';
    public static UNISEX: string = 'U';
    public static SCALE: string = 'h';
    public static STD: string = 'std';
    public static DEFAULT_FRAME: string = '0';
    public static HD: string = 'hd';
    public static HAIR: string = 'hr';
    public static HAT: string = 'ha';
    public static HEAD_ACCESSORIES: string = 'he';
    public static EYE_ACCESSORIES: string = 'ea';
    public static FACE_ACCESSORIES: string = 'fa';
    public static JACKET: string = 'cc';
    public static SHIRT: string = 'ch';
    public static CHEST_ACCESSORIES: string = 'ca';
    public static CHEST_PRINTS: string = 'cp';
    public static TROUSERS: string = 'lg';
    public static SHOES: string = 'sh';
    public static TROUSER_ACCESSORIES: string = 'wa';
    public static MISC: string = 'mc';
    public static PET: string = 'pt';
    public static BLOCKED_FX_TYPES: number[] = [28, 29, 30, 33, 34, 35, 36, 37, 38, 39, 40, 41, 42, 43, 68];

    private _data: Map<string, number>;
    private _colors: Map<string, number[]>;
    private _gender: string = 'M';
    private _isDisposed: boolean;
    private _avatarEffectType: number = -1;

    public loadAvatarData(figure: string, gender: string): void
    {
        this._data = new Map();
        this._colors = new Map();
        this._gender = gender;

        this.parseFigureString(figure);
    }

    public dispose(): void
    {
        this._data = null;
        this._colors = null;
        this._isDisposed = true;
    }

    public get disposed(): boolean
    {
        return this._isDisposed;
    }

    private parseFigureString(figure: string): void
    {
        if(!figure) return;

        for(const set of figure.split('.'))
        {
            const pieces = set.split('-');

            if(pieces.length > 0)
            {
                const part = pieces[0];
                const setId = parseInt(pieces[1]);
                const colors: number[] = [];

                let index = 2;

                while(index < pieces.length)
                {
                    colors.push(parseInt(pieces[index]));

                    index++;
                }

                if(!colors.length) colors.push(0);

                this.savePartSetId(part, setId, false);
                this.savePartSetColourId(part, colors, false);
            }
        }
    }

    public hasSetType(partType: string): boolean
    {
        return !!this._data.get(partType);
    }

    public getPartSetId(partType: string): number
    {
        if(this.hasSetType(partType)) return this._data.get(partType);

        return -1;
    }

    public getColourIds(partType: string): number[]
    {
        if(this._colors.get(partType)) return this._colors.get(partType);

        return [];
    }

    public getFigureString(): string
    {
        let figure = '';

        const sets: string[] = [];

        for(const [key, value] of this._data.entries())
        {
            let set = ((key + '-') + value);

            const colors = this._colors.get(key);

            if(colors) for(const color of colors) set = (set + ('-' + color));

            sets.push(set);
        }

        let index = 0;

        while(index < sets.length)
        {
            figure = (figure + sets[index]);

            if(index < (sets.length - 1)) figure = (figure + '.');

            index++;
        }

        return figure;
    }

    public savePartData(partType: string, partSetId: number, colorIds: number[], isDefault: boolean = false): void
    {
        this.savePartSetId(partType, partSetId, isDefault);
        this.savePartSetColourId(partType, colorIds, isDefault);
    }

    private savePartSetId(partType: string, partSetId: number, isDefault: boolean = true): void
    {
        switch(partType)
        {
            case FigureDataContainer.HD:
            case FigureDataContainer.HAIR:
            case FigureDataContainer.HAT:
            case FigureDataContainer.HEAD_ACCESSORIES:
            case FigureDataContainer.EYE_ACCESSORIES:
            case FigureDataContainer.FACE_ACCESSORIES:
            case FigureDataContainer.SHIRT:
            case FigureDataContainer.JACKET:
            case FigureDataContainer.CHEST_ACCESSORIES:
            case FigureDataContainer.CHEST_PRINTS:
            case FigureDataContainer.TROUSERS:
            case FigureDataContainer.SHOES:
            case FigureDataContainer.TROUSER_ACCESSORIES:
            case FigureDataContainer.MISC:
            case FigureDataContainer.PET:
                if(partSetId >= 0)
                {
                    this._data.set(partType, partSetId);
                }
                else
                {
                    this._data.delete(partType);
                }
        }
    }

    public savePartSetColourId(partType: string, colorIds: number[], isDefault: boolean = true): void
    {
        switch(partType)
        {
            case FigureDataContainer.HD:
            case FigureDataContainer.HAIR:
            case FigureDataContainer.HAT:
            case FigureDataContainer.HEAD_ACCESSORIES:
            case FigureDataContainer.EYE_ACCESSORIES:
            case FigureDataContainer.FACE_ACCESSORIES:
            case FigureDataContainer.SHIRT:
            case FigureDataContainer.JACKET:
            case FigureDataContainer.CHEST_ACCESSORIES:
            case FigureDataContainer.CHEST_PRINTS:
            case FigureDataContainer.TROUSERS:
            case FigureDataContainer.SHOES:
            case FigureDataContainer.TROUSER_ACCESSORIES:
            case FigureDataContainer.MISC:
            case FigureDataContainer.PET:
                this._colors.set(partType, colorIds);
                return;
        }
    }

    public getFigureStringWithFace(faceSetId: number): string
    {
        const partSets: string[] = [FigureDataContainer.HD];

        let figure = '';
        const sets: string[] = [];

        for(const part of partSets)
        {
            const colors = this._colors.get(part);

            if(colors)
            {
                let setId = this._data.get(part);

                if(part === FigureDataContainer.HD) setId = faceSetId;

                let set = ((part + '-') + setId);

                if(setId >= 0)
                {
                    let colorIndex = 0;

                    while(colorIndex < colors.length)
                    {
                        set = (set + ('-' + colors[colorIndex]));

                        colorIndex++;
                    }
                }

                sets.push(set);
            }
        }

        let index = 0;

        while(index < sets.length)
        {
            figure = (figure + sets[index]);

            if(index < (sets.length - 1)) figure = (figure + '.');

            index++;
        }

        return figure;
    }

    public get gender(): string
    {
        return this._gender;
    }
}
