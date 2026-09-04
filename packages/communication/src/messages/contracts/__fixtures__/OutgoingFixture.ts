class OutgoingFixture implements IMessageComposer<[number, string, Short, boolean]>
{
    constructor(
        private readonly id: number,
        private readonly name: string,
        private readonly rank: Short,
        private readonly enabled: boolean)
    {
    }

    public getMessageArray(): [number, string, Short, boolean]
    {
        return [this.id, this.name, this.rank, this.enabled];
    }
}

interface IMessageComposer<T extends unknown[]>
{
    getMessageArray(): T;
}

class Short
{
    constructor(public readonly value: number)
    {}
}
