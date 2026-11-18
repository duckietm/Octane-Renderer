class HelperNamedLikeReadFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        wrapper.readInt();
        HelperLongReader.readLong(wrapper);
        return true;
    }
}

class HelperLongReader
{
    public static readLong(wrapper: Wrapper): number
    {
        const high = wrapper.readInt();
        const low = wrapper.readInt();
        return (high * 4294967296) + low;
    }
}

interface Wrapper
{
    readInt(): number;
}
