export class BarrelEntry
{
    constructor(wrapper: { readString(): string })
    {
        wrapper.readString();
    }
}
