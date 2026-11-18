class ConditionalItemListParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            wrapper.readInt();
            const flag = wrapper.bytesAvailable ? wrapper.readBoolean() : false;
        }
        return true;
    }
}

interface Wrapper
{
    readInt(): number;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
