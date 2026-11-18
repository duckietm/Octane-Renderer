class InstanceParseDelegateFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const count = wrapper.readInt();
        for(let i = 0; i < count; i++)
        {
            const item = new InstanceDelegate();
            item.parse(wrapper);
        }
        return true;
    }
}

class InstanceDelegate
{
    public parse(wrapper: Wrapper): void
    {
        wrapper.readString();
        this.readTail(wrapper);
    }

    private readTail(wrapper: Wrapper): void
    {
        wrapper.readInt();
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
