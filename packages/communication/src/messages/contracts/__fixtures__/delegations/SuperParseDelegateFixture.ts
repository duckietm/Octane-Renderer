class SuperBase
{
    public parse(wrapper: Wrapper): boolean
    {
        wrapper.readInt();
        return true;
    }
}

class SuperParseDelegateFixture extends SuperBase
{
    public parse(wrapper: Wrapper): boolean
    {
        super.parse(wrapper);
        wrapper.readBoolean();
        return true;
    }
}

interface Wrapper
{
    readInt(): number;
    readBoolean(): boolean;
}
