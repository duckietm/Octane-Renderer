class HelperLoopWithoutCountParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        for(let i = 0; i < 3; i++) this.readEntry(wrapper);
        return true;
    }

    private readEntry(wrapper: Wrapper): void
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
