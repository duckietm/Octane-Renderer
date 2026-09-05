import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/** Server ack that a chest open was accepted (official Syhytarer / 1174 wire shape). */
export class ChestOpenMessageParser implements IMessageParser
{
    private _chestId: number = 0;

    public flush(): boolean
    {
        this._chestId = 0;
        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._chestId = wrapper.readInt();
        return true;
    }

    public get chestId(): number
    {
        return this._chestId;
    }
}
