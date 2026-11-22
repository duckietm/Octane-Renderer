class EmptyItemListParserFixture
{
    private _labels: number[] = [];

    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++) this._labels.push(i);
        return true;
    }
}

interface Wrapper
{
    readInt(): number;
}
