import { IMessageDataWrapper, IMessageParser } from '@octane/api';
import { ModeratorUserRecordData } from './ModeratorUserRecordData';

export class ModeratorUserRecordsParser implements IMessageParser
{
    private _userId: number = 0;
    private _kind: number = 0;
    private _undetailed: number = 0;
    private _records: ModeratorUserRecordData[] = [];

    public flush(): boolean
    {
        this._userId = 0;
        this._kind = 0;
        this._undetailed = 0;
        this._records = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._userId = wrapper.readInt();
        this._kind = wrapper.readInt();
        this._undetailed = wrapper.readInt();

        let count = wrapper.readInt();

        while(count > 0)
        {
            this._records.push(new ModeratorUserRecordData(wrapper));

            count--;
        }

        return true;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public get kind(): number
    {
        return this._kind;
    }

    public get undetailed(): number
    {
        return this._undetailed;
    }

    public get records(): ModeratorUserRecordData[]
    {
        return this._records;
    }
}
