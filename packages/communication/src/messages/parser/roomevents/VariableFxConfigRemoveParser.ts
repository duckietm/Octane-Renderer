import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class VariableFxConfigRemoveParser implements IMessageParser
{
    private _configIds: number[];

    public flush(): boolean
    {
        this._configIds = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._configIds = [];

        let totalConfigs = wrapper.readInt();

        while(totalConfigs > 0)
        {
            this._configIds.push(wrapper.readInt());

            totalConfigs--;
        }

        return true;
    }

    public get configIds(): number[]
    {
        return this._configIds;
    }
}
