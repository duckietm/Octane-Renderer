import { IMessageComposer } from '@octane/api';

export class TranslationTextRequestComposer implements IMessageComposer<ConstructorParameters<typeof TranslationTextRequestComposer>>
{
    private _data: ConstructorParameters<typeof TranslationTextRequestComposer>;

    constructor(requestId: number, text: string, targetLanguage: string)
    {
        this._data = [requestId, text, targetLanguage];
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
