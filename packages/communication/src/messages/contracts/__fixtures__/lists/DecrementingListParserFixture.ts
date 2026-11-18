class DecrementingListParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        let count = wrapper.readInt();
        while(count > 0)
        {
            wrapper.readInt();
            count--;
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
