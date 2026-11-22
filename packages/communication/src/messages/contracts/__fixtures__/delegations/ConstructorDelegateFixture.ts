class ConstructorDelegateFixture
{
    private _entries: DelegateEntry[] = [];

    public parse(wrapper: Wrapper): boolean
    {
        const id = wrapper.readInt();
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++) this._entries.push(new DelegateEntry(wrapper));
        const done = wrapper.readBoolean();
        return done;
    }
}

class DelegateEntry
{
    constructor(wrapper: Wrapper)
    {
        wrapper.readInt();
        wrapper.readString();
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
