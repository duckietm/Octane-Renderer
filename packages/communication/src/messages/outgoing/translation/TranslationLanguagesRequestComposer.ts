import { IMessageComposer } from '@octane/api';

export class TranslationLanguagesRequestComposer implements IMessageComposer<ConstructorParameters<typeof TranslationLanguagesRequestComposer>>
{
    private _data: ConstructorParameters<typeof TranslationLanguagesRequestComposer>;

    constructor(displayLanguage: string = 'en')
    {
        this._data = [displayLanguage];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
