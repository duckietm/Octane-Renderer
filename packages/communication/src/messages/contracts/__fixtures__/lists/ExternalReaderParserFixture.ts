const readListFixtureEntry = (wrapper: Wrapper): number => wrapper.readInt();

class ExternalReaderParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        wrapper.readInt();
        readListFixtureEntry(wrapper);
        wrapper.readInt();
        return true;
    }
}

interface Wrapper
{
    readInt(): number;
}
