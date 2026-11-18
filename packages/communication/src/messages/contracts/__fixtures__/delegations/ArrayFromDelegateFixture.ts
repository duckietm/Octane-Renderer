class ArrayFromDelegateFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        const id = wrapper.readInt();
        const rows = Array.from({ length: wrapper.readInt() }, () => ({
            name: wrapper.readString(),
            cells: Array.from({ length: wrapper.readInt() }, () => wrapper.readInt())
        }));
        wrapper.readBoolean();
        return rows.length > id;
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
