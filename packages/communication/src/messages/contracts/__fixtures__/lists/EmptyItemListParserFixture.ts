class EmptyItemListParserFixture
{
    private _labels: unknown[] = [];

    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++) this._labels.push(ListFixtureLabel.parse(wrapper));
        return true;
    }
}

class ListFixtureLabel
{
    public static parse(wrapper: Wrapper): unknown
    {
        return wrapper.readInt();
    }
}

interface Wrapper
{
    readInt(): number;
}
