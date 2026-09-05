import { IMessageComposer } from '@octane/api';

export class TryPhoneNumberMessageComposer implements IMessageComposer<ConstructorParameters<typeof TryPhoneNumberMessageComposer>>
{
    private _data: ConstructorParameters<typeof TryPhoneNumberMessageComposer>;

    constructor(countryCode: string, phoneNumber: string)
    {
        this._data = [countryCode, phoneNumber];
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
