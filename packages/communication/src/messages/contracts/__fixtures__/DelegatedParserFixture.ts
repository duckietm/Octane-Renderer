class DelegatedParserFixture
{
    public parse(wrapper: Wrapper): boolean
    {
        new Payload(wrapper);
        return true;
    }
}

interface Wrapper {}
declare class Payload
{
    constructor(wrapper: Wrapper);
}
