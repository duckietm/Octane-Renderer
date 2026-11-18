class ListParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const count: number = wrapper.readInt();
        let index = 0;

        while(index < count)
        {
            const id = wrapper.readInt();
            const name = wrapper.readString();
            index++;
        }

        const confirmed = wrapper.readBoolean();
        return confirmed;
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
