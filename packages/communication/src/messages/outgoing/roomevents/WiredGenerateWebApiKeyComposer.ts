import { IMessageComposer } from '@octane/api';

/** Asks the server to mint a fresh read or write key for a `wf_xtra_var_web_api` box. */
export class WiredGenerateWebApiKeyComposer implements IMessageComposer<ConstructorParameters<typeof WiredGenerateWebApiKeyComposer>>
{
    private _data: ConstructorParameters<typeof WiredGenerateWebApiKeyComposer>;

    constructor(itemId: number, isReadKey: boolean)
    {
        this._data = [ itemId, isReadKey ];
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
