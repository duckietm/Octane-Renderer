import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class TranslationResultParser implements IMessageParser
{
    private _requestId: number;
    private _success: boolean;
    private _errorMessage: string;
    private _originalText: string;
    private _translatedText: string;
    private _detectedLanguage: string;
    private _targetLanguage: string;

    public flush(): boolean
    {
        this._requestId = 0;
        this._success = false;
        this._errorMessage = '';
        this._originalText = '';
        this._translatedText = '';
        this._detectedLanguage = '';
        this._targetLanguage = '';

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._requestId = wrapper.readInt();
        this._success = wrapper.readBoolean();
        this._errorMessage = wrapper.readString();
        this._originalText = wrapper.readString();
        this._translatedText = wrapper.readString();
        this._detectedLanguage = wrapper.readString();
        this._targetLanguage = wrapper.readString();

        return true;
    }

    public get requestId(): number
    {
        return this._requestId;
    }

    public get success(): boolean
    {
        return this._success;
    }

    public get errorMessage(): string
    {
        return this._errorMessage;
    }

    public get originalText(): string
    {
        return this._originalText;
    }

    public get translatedText(): string
    {
        return this._translatedText;
    }

    public get detectedLanguage(): string
    {
        return this._detectedLanguage;
    }

    public get targetLanguage(): string
    {
        return this._targetLanguage;
    }
}
