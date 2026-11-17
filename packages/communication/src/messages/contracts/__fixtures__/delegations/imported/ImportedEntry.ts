export class ImportedEntry
{
    constructor(wrapper: { readInt(): number })
    {
        wrapper.readInt();
    }
}
