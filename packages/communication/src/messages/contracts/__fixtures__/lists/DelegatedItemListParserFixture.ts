class DelegatedItemListParserFixture
{
    private _items: ListFixtureEntry[] = [];

    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++) this._items.push(new ListFixtureEntry(wrapper));
        return true;
    }
}

class ListFixtureEntry
{
    constructor(wrapper: Wrapper)
    {
        wrapper.readInt();
    }
}

interface Wrapper
{
    readInt(): number;
    readShort(): number;
    readString(): string;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
