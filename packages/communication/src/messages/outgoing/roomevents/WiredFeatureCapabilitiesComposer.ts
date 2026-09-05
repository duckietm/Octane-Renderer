import { IMessageComposer } from '@octane/api';

export class WiredFeatureCapabilitiesComposer implements IMessageComposer<ConstructorParameters<typeof WiredFeatureCapabilitiesComposer>>
{
    private _data: ConstructorParameters<typeof WiredFeatureCapabilitiesComposer>;

    constructor(protocolVersion: number, capabilities: number)
    {
        this._data = [ protocolVersion, capabilities ];
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
