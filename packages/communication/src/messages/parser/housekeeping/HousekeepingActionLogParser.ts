import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { HousekeepingActionLogEntryData } from './HousekeepingActionLogEntryData';

export class HousekeepingActionLogParser implements IMessageParser
{
    private _entries: HousekeepingActionLogEntryData[] = [];

    public flush(): boolean
    {
        this._entries = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        const count = wrapper.readInt();

        for(let i = 0; i < count; i++) this._entries.push(new HousekeepingActionLogEntryData(wrapper));

        return true;
    }

    public get entries(): HousekeepingActionLogEntryData[]
    {
        return this._entries;
    }
}
