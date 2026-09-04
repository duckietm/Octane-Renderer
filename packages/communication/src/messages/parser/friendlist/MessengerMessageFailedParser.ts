import { IMessageDataWrapper, IMessageParser } from '@nitrots/api';
export class MessengerMessageFailedParser implements IMessageParser
{
    private _confirmationId=0; private _errorCode=0;
    public flush()
    {
        this._confirmationId=this._errorCode=0;return true;
    } public parse(w:IMessageDataWrapper)
    {
        if(!w) return false;this._confirmationId=w.readInt();this._errorCode=w.readInt();return true;
    }
    get confirmationId()
    {
        return this._confirmationId;
    } get errorCode()
    {
        return this._errorCode;
    }
}
