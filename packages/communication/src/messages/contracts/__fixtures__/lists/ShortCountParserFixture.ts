class ShortCountParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readShort();
        for(let i = 0; i < count; i++) wrapper.readInt();
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
