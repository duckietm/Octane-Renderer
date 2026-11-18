const readDelegateEntry = (wrapper: Wrapper): number =>
{
    wrapper.readInt();
    return wrapper.readInt();
};

function readDelegateName(wrapper: Wrapper): string
{
    return wrapper.readString();
}

class ModuleFunctionDelegateFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        readDelegateName(wrapper);
        readDelegateEntry(wrapper);
        return true;
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
    readBoolean(): boolean;
    bytesAvailable: boolean;
}
