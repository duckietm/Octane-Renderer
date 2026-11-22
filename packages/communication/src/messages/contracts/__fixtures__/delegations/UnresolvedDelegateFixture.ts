class UnresolvedDelegateFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        wrapper.readInt();
        new MissingDelegate(wrapper);
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

declare const MissingDelegate: new (wrapper: Wrapper) => unknown;
