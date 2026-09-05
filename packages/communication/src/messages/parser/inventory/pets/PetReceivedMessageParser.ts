import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { PetData } from './PetData';

export class PetReceivedMessageParser implements IMessageParser
{
    private _boughtAsGift: boolean;
    private _pet: PetData;

    public flush(): boolean
    {
        this._boughtAsGift = false;
        this._pet = null;

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        this._boughtAsGift = wrapper.readBoolean();
        this._pet = new PetData(wrapper);

        return true;
    }

    public get boughtAsGift(): boolean
    {
        return this._boughtAsGift;
    }

    public get pet(): PetData
    {
        return this._pet;
    }
}
