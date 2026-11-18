class StaticParseDelegateFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        StaticDelegate.parse(wrapper);
        wrapper.readBoolean();
        return true;
    }
}

class StaticDelegate
{
    public static parse(wrapper: Wrapper): number
    {
        return wrapper.readInt();
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
