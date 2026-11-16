import { WireSchema } from './PacketContractTypes';

export const verifyPacketContract = (
    expected: readonly WireSchema[],
    observed: readonly WireSchema[],
    context: string): void => compareFields(expected, observed, `${ context } fields`);

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
    // Same rule as the emulator's verifier: trailing optionals may be missing at any level.
    const missingOnlyOptionals = observed.length < expected.length
        && expected.slice(observed.length).every(field => field.type === 'optional');
    if(observed.length > expected.length || (observed.length < expected.length && !missingOnlyOptionals))
        throw new Error(`${ path }: expected ${ expected.length } fields, observed ${ observed.length }`);
    observed.forEach((field, index) => compare(expected[index], field, `${ path }[${ index }]`));
};
