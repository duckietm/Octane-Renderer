class BytesAvailableLoopParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        while(wrapper.bytesAvailable) wrapper.readInt();
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
