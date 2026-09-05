import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export interface ITranslationLanguageData
{
    code: string;
    name: string;
}

export class TranslationLanguagesParser implements IMessageParser
{
    private _success: boolean;
    private _errorMessage: string;
    private _languages: ITranslationLanguageData[];

    public flush(): boolean
    {
        this._success = false;
        this._errorMessage = '';
        this._languages = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._success = wrapper.readBoolean();
        this._errorMessage = wrapper.readString();
        this._languages = [];

        const totalLanguages = wrapper.readInt();

        for(let index = 0; index < totalLanguages; index++)
        {
            this._languages.push({
                code: wrapper.readString(),
                name: wrapper.readString()
            });
        }

        return true;
    }

    public get success(): boolean
    {
        return this._success;
    }

    public get errorMessage(): string
    {
        return this._errorMessage;
    }

    public get languages(): ITranslationLanguageData[]
    {
        return this._languages;
    }
}
