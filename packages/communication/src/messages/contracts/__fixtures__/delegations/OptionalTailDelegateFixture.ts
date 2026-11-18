class OptionalTailDelegateFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        new OptionalTailEntry(wrapper);
        wrapper.readInt();
        return true;
    }
}

class OptionalTailEntry
{
    constructor(wrapper: Wrapper)
    {
        wrapper.readInt();
        if(!wrapper.bytesAvailable) return;
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
