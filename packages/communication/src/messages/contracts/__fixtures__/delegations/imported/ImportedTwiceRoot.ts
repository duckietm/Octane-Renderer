import { TwiceEntry } from './twice';

export class ImportedTwiceRoot
{
    public parse(wrapper: { readInt(): number }): boolean
    {
        new TwiceEntry(wrapper);
        return true;
    }
}
