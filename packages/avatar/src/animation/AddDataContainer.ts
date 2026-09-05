import { IAssetAnimationAdd } from '@octane/api';

export class AddDataContainer
{
    private _id: string;
    private _align: string;
    private _base: string;
    private _ink: number;
    private _blend: number;

    constructor(data: IAssetAnimationAdd)
    {
        this._id = data.id || '';
        this._align = data.align || '';
        this._base = data.base || '';
        this._ink = data.ink || 0;
        this._blend = 0;

        const blend = data.blend;

        if(blend)
        {
            if(blend.length > 0)
            {
                this._blend = parseInt(blend);

                if(this._blend > 1) this._blend = (this._blend / 100);
            }
        }
    }

    public get id(): string
    {
        return this._id;
    }

    public get align(): string
    {
        return this._align;
    }

    public get base(): string
    {
        return this._base;
    }

    public get ink(): number
    {
        return this._ink;
    }

    public get blend(): number
    {
        return this._blend;
    }

    public get isBlended(): boolean
    {
        return this._blend !== 1;
    }
}
