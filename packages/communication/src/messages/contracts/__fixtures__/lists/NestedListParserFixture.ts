class NestedListParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const rows = wrapper.readInt();
        for(let row = 0; row < rows; row++)
        {
            wrapper.readString();
            const cells = wrapper.readInt();
            for(let cell = 0; cell < cells; cell++) wrapper.readInt();
        }
        return true;
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
