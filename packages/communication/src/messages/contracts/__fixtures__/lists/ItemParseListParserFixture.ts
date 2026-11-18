class ItemParseListParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            wrapper.readInt();
            const data = new ListFixtureData();
            data.parse(wrapper);
        }
        return true;
    }
}

class ListFixtureData
{
    public parse(wrapper: Wrapper): void
    {
        wrapper.readInt();
    }
}

interface Wrapper
{
    readInt(): number;
}
