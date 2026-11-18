class ConditionalDelegateFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const kind = wrapper.readInt();
        if(kind > 0) new ConditionalEntry(wrapper);
        return true;
    }
}

class ConditionalEntry
{
    constructor(wrapper: Wrapper)
    {
        wrapper.readString();
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
