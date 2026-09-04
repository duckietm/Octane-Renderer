import { WireSchema } from './PacketContractTypes';

export const verifyPacketContract = (
    expected: readonly WireSchema[],
    observed: readonly WireSchema[],
    context: string): void =>
{
    if(expected.length !== observed.length)
        throw new Error(`${ context } fields: expected ${ expected.length } fields, observed ${ observed.length }`);
    expected.forEach((field, index) => compare(field, observed[index], `${ context } fields[${ index }]`));
};

const compare = (expected: WireSchema, observed: WireSchema, path: string): void =>
{
    if(expected.type !== observed.type)
        throw new Error(`${ path }: expected ${ expected.type }, observed ${ observed.type }`);
    if(expected.type === 'list' && observed.type === 'list')
    {
        if(expected.countType !== observed.countType)
            throw new Error(`${ path }.list.count: expected ${ expected.countType }, observed ${ observed.countType }`);
        compareFields(expected.item, observed.item, `${ path }.list.item`);
    }
    else if(expected.type === 'optional' && observed.type === 'optional')
    {
        if(expected.controller !== observed.controller)
            throw new Error(`${ path }.optional: expected controller ${ expected.controller }, observed ${ observed.controller }`);
        compareFields(expected.fields, observed.fields, `${ path }.optional.fields`);
    }
    else if(expected.type === 'variant' && observed.type === 'variant')
    {
        if(expected.discriminator !== observed.discriminator)
            throw new Error(`${ path }.variant: expected discriminator ${ expected.discriminator }, observed ${ observed.discriminator }`);
        const expectedKeys = Object.keys(expected.branches).sort();
        const observedKeys = Object.keys(observed.branches).sort();
        if(expectedKeys.join(',') !== observedKeys.join(','))
            throw new Error(`${ path }.variant: expected branches ${ expectedKeys.join(', ') }, observed ${ observedKeys.join(', ') }`);
        expectedKeys.forEach(key => compareFields(
            expected.branches[key], observed.branches[key], `${ path }.variant.branches.${ key }`));
    }
};

const compareFields = (
    expected: readonly WireSchema[],
    observed: readonly WireSchema[],
    path: string): void =>
{
    if(expected.length !== observed.length)
        throw new Error(`${ path }: expected ${ expected.length } fields, observed ${ observed.length }`);
    expected.forEach((field, index) => compare(field, observed[index], `${ path }[${ index }]`));
};
