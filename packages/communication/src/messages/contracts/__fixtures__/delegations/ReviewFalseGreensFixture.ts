class RgTernaryDelegate
{
    private _entry: RgEntry = null;

    public parse(wrapper: Wrapper): boolean
    {
        const flag = wrapper.readInt();
        this._entry = flag > 0 ? new RgEntry(wrapper) : null;
        return true;
    }
}

class RgShortCircuitDelegate
{
    public parse(wrapper: Wrapper): boolean
    {
        const flag = wrapper.readInt();
        return flag > 0 && RgStaticReader.read(wrapper);
    }
}

class RgCallbackDelegate
{
    private _ids: number[] = [];
    private _entries: RgEntry[] = [];

    public parse(wrapper: Wrapper): boolean
    {
        wrapper.readInt();
        this._ids.forEach(() => this._entries.push(new RgEntry(wrapper)));
        return true;
    }
}

class RgStoredWrapperDelegate
{
    public parse(wrapper: Wrapper): boolean
    {
        wrapper.readInt();
        const holder = new RgHolder(wrapper);
        holder.load();
        return true;
    }
}

class RgArgumentReadDelegate
{
    public parse(wrapper: Wrapper): boolean
    {
        new RgPair(wrapper.readInt(), wrapper);
        return true;
    }
}

class RgConditionalInsideDelegate
{
    public parse(wrapper: Wrapper): boolean
    {
        new RgFlagged(wrapper, false);
        return true;
    }
}

class RgDeclaredTypeReceiver
{
    private _item: RgParsable = null;

    public parse(wrapper: Wrapper): boolean
    {
        this._item.parse(wrapper);
        return true;
    }
}

class RgEntry
{
    constructor(wrapper: Wrapper)
    {
        wrapper.readString();
    }
}

class RgStaticReader
{
    public static read(wrapper: Wrapper): boolean
    {
        return wrapper.readString().length > 0;
    }
}

class RgHolder
{
    private _wrapper: Wrapper;

    constructor(wrapper: Wrapper)
    {
        this._wrapper = wrapper;
    }

    public load(): string
    {
        return this._wrapper.readString();
    }
}

class RgPair
{
    constructor(first: number, wrapper: Wrapper)
    {
        wrapper.readString();
    }
}

class RgOverriddenBase
{
    public parse(wrapper: Wrapper): boolean
    {
        wrapper.readInt();
        this.extra(wrapper);
        return true;
    }

    protected extra(wrapper: Wrapper): void
    {
    }
}

class RgOverridingSub extends RgOverriddenBase
{
    protected extra(wrapper: Wrapper): void
    {
        wrapper.readString();
    }
}

class RgSuperOverrideDelegate extends RgOverridingSub
{
    public parse(wrapper: Wrapper): boolean
    {
        super.parse(wrapper);
        return true;
    }
}

class RgFlagged
{
    constructor(wrapper: Wrapper, withFlag: boolean)
    {
        wrapper.readInt();
        const flag = withFlag ? wrapper.readBoolean() : false;
    }
}

class RgParsable
{
    public parse(wrapper: Wrapper): void
    {
        wrapper.readInt();
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
    readBoolean(): boolean;
}
