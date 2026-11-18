import { ImportedEntry } from './ImportedEntry';
import { BarrelEntry } from './barrel';

export class ImportedConstructorFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        new ImportedEntry(wrapper);
        new BarrelEntry(wrapper);
        return true;
    }
}

interface Wrapper
{
    readInt(): number;
    readString(): string;
}
