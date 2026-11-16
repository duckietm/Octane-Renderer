class ConditionalReadListParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            const id = wrapper.readInt();
            if(id > 0) wrapper.readString();
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
