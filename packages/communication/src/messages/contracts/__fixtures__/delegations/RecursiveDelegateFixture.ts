class RecursiveDelegateFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        new RecursiveNode(wrapper);
        return true;
    }
}

class RecursiveNode
{
    constructor(wrapper: Wrapper)
    {
        wrapper.readInt();
        new RecursiveNode(wrapper);
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
