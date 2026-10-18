import { IMessageComposer } from '@octane/api';

/** AIR WiredContractController: asks for the contents of the contract the server opened. */
export class GetWiredContractContentsComposer implements IMessageComposer<ConstructorParameters<typeof GetWiredContractContentsComposer>>
{
    private _data: ConstructorParameters<typeof GetWiredContractContentsComposer>;

    constructor(contractId: number)
    {
        this._data = [ contractId ];
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
