export class TwiceEntry
{
    constructor(wrapper: { readInt(): number })
    {
        wrapper.readInt();
    }
}
