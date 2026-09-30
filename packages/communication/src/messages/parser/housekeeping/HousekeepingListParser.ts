import { IMessageDataWrapper, IMessageParser } from '@octane/api';

/**
 * One housekeeping list as a table (9206): the list key and target it answers,
 * a result, the column keys, then one string per column for every row.
 */
export class HousekeepingListParser implements IMessageParser
{
    private _listKey: string = '';
    private _targetId: number = 0;
    private _ok: boolean = false;
    private _message: string = '';
    private _columns: string[] = [];
    private _rows: string[][] = [];

    public flush(): boolean
    {
        this._listKey = '';
        this._targetId = 0;
        this._ok = false;
        this._message = '';
        this._columns = [];
        this._rows = [];

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        this._listKey = wrapper.readString();
        this._targetId = wrapper.readInt();
        this._ok = wrapper.readBoolean();
        this._message = wrapper.readString();

        let columnCount = wrapper.readInt();

        while(columnCount > 0)
        {
            this._columns.push(wrapper.readString());

            columnCount--;
        }

        let rowCount = wrapper.readInt();

        while(rowCount > 0)
        {
            const row: string[] = [];

            for(let i = 0; i < this._columns.length; i++) row.push(wrapper.readString());

            this._rows.push(row);

            rowCount--;
        }

        return true;
    }

    public get listKey(): string
    {
        return this._listKey;
    }

    public get targetId(): number
    {
        return this._targetId;
    }

    public get ok(): boolean
    {
        return this._ok;
    }

    public get message(): string
    {
        return this._message;
    }

    public get columns(): string[]
    {
        return this._columns;
    }

    public get rows(): string[][]
    {
        return this._rows;
    }
}
