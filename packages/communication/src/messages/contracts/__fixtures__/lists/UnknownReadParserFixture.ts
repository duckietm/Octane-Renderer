class UnknownReadParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        wrapper.readInt();
        wrapper.readDouble();
        return true;
    }
}

interface Wrapper
{
    readInt(): number;
    readDouble(): number;
}
