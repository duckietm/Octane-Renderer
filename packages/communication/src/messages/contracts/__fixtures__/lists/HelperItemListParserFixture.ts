class HelperItemListParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++) this.readEntry(wrapper);
        return true;
    }

    private readEntry(wrapper: Wrapper): void
    {
        wrapper.readInt();
        wrapper.readString();
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
