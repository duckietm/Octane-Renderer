import { IMessageDataWrapper } from '@octane/api';

export class CatalogLocalizationData
{
    private _images: string[];
    private _texts: string[];

    constructor(wrapper: IMessageDataWrapper)
    {
        this._images = [];
        this._texts = [];

        let totalImages = Math.min(wrapper.readInt(), 100);

        while(totalImages > 0)
        {
            this._images.push(wrapper.readString());

            totalImages--;
        }

        let totalTexts = Math.min(wrapper.readInt(), 100);

        while(totalTexts > 0)
        {
            this._texts.push(wrapper.readString());

            totalTexts--;
        }
    }

    public get images(): string[]
    {
        return this._images;
    }

    public get texts(): string[]
    {
        return this._texts;
    }
}
