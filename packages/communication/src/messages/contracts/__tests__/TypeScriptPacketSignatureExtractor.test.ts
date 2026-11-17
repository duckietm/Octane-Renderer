import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyPacketContract } from '../PacketContractVerifier';
import { extractTypeScriptPacketSignature } from '../TypeScriptPacketSignatureExtractor';
import { WireSchema } from '../PacketContractTypes';

const fixture = (name: string) => resolve(
    'packages/communication/src/messages/contracts/__fixtures__', name);

const types = (fields: readonly WireSchema[]) => fields.map(field => field.type);

const shape = (fields: readonly WireSchema[]): string => fields.map(field =>
{
    if(field.type === 'list') return `list<${ field.countType }>[${ shape(field.item) }]`;
    if(field.type === 'optional') return `optional[${ shape(field.fields) }]`;
    if(field.type === 'variant') return 'variant';
    return field.type;
}).join(',');

const listShape = (name: string, side: 'incoming' | 'outgoing'): string =>
{
    const result = extractTypeScriptPacketSignature(fixture(`lists/${ name }`), side);

    expect(result.unsupportedReason).toBeUndefined();
    return shape(result.fields);
};

const listReason = (name: string, side: 'incoming' | 'outgoing'): string | undefined =>
    extractTypeScriptPacketSignature(fixture(`lists/${ name }`), side).unsupportedReason;

const delegation = (name: string, className?: string) =>
    extractTypeScriptPacketSignature(fixture(`delegations/${ name }`), 'incoming', className);

const delegationShape = (name: string, className?: string): string =>
{
    const result = delegation(name, className);

    expect(result.unsupportedReason).toBeUndefined();
    return shape(result.fields);
};

describe('TypeScript delegation extraction', () =>
{
    it('follows a constructor in the same file', () =>
    {
        expect(delegationShape('ConstructorDelegateFixture.ts')).toBe('int,list<int>[int,string],boolean');
    });

    it('follows a static parse', () =>
    {
        expect(delegationShape('StaticParseDelegateFixture.ts')).toBe('int,boolean');
    });

    it('follows an instance parse on a local new, with its own helpers', () =>
    {
        expect(delegationShape('InstanceParseDelegateFixture.ts')).toBe('list<int>[string,int]');
    });

    it('follows super.parse', () =>
    {
        expect(delegationShape('SuperParseDelegateFixture.ts', 'SuperParseDelegateFixture')).toBe('int,boolean');
    });

    it('follows module functions', () =>
    {
        expect(delegationShape('ModuleFunctionDelegateFixture.ts')).toBe('string,int,int');
    });

    it('extracts nested Array.from as lists', () =>
    {
        expect(delegationShape('ArrayFromDelegateFixture.ts')).toBe('int,list<int>[string,list<int>[int]],boolean');
    });

    it('keeps a recursive delegate unsupported', () =>
    {
        expect(delegation('RecursiveDelegateFixture.ts').unsupportedReason).toContain('Recursive packet helper');
    });

    it('keeps an unresolved class unsupported', () =>
    {
        expect(delegation('UnresolvedDelegateFixture.ts').unsupportedReason).toBeDefined();
    });

    it('keeps a delegate called under a branch unsupported', () =>
    {
        expect(delegation('ConditionalDelegateFixture.ts').unsupportedReason).toContain('Data-dependent');
    });

    it('keeps a delegate with an optional tail unsupported', () =>
    {
        expect(delegation('OptionalTailDelegateFixture.ts').unsupportedReason).toContain('Optional tail');
    });

    it('follows a constructor imported from a sibling file and through a barrel', () =>
    {
        expect(delegationShape('imported/ImportedConstructorFixture.ts')).toBe('int,string');
    });

    it('keeps a name exported twice unsupported', () =>
    {
        expect(delegation('imported/ImportedTwiceRoot.ts').unsupportedReason).toContain('exported twice');
    });
});

describe('TypeScript list extraction', () =>
{
    it('extracts a list read after its count', () =>
    {
        expect(listShape('ListParserFixture.ts', 'incoming')).toBe('list<int>[int,string],boolean');
    });

    it('extracts a short count', () =>
    {
        expect(listShape('ShortCountParserFixture.ts', 'incoming')).toBe('list<short>[int]');
    });

    it('extracts a nested list', () =>
    {
        expect(listShape('NestedListParserFixture.ts', 'incoming')).toBe('list<int>[string,list<int>[int]]');
    });

    it('extracts a decrementing while', () =>
    {
        expect(listShape('DecrementingListParserFixture.ts', 'incoming')).toBe('list<int>[int]');
    });

    it('extracts a list whose item is read by a local helper', () =>
    {
        expect(listShape('HelperItemListParserFixture.ts', 'incoming')).toBe('list<int>[int,string]');
    });

    it('follows a list item read by a constructor', () =>
    {
        expect(listShape('DelegatedItemListParserFixture.ts', 'incoming')).toBe('list<int>[int]');
    });

    it('rejects a conditional read in the body', () =>
    {
        expect(listReason('ConditionalReadListParserFixture.ts', 'incoming')).toContain('Data-dependent');
    });

    it('keeps a list whose item reads nothing statically unsupported', () =>
    {
        expect(listReason('EmptyItemListParserFixture.ts', 'incoming')).toContain('reads nothing');
    });

    it('follows a read passed to a module function', () =>
    {
        expect(listShape('ExternalReaderParserFixture.ts', 'incoming')).toBe('int,int,int');
    });

    it('follows an item read through another object', () =>
    {
        expect(listShape('ItemParseListParserFixture.ts', 'incoming')).toBe('list<int>[int,int]');
    });

    it('keeps an unknown wrapper read unsupported', () =>
    {
        expect(listReason('UnknownReadParserFixture.ts', 'incoming')).toContain('Unknown packet read readDouble');
    });

    it('keeps a conditional read inside a list item unsupported', () =>
    {
        expect(listReason('ConditionalItemListParserFixture.ts', 'incoming')).toContain('Conditional packet read');
    });

    it('rejects a loop driven by bytesAvailable', () =>
    {
        expect(listReason('BytesAvailableLoopParserFixture.ts', 'incoming')).toContain('Data-dependent');
    });

    it('rejects a loop that reads through a helper without a count', () =>
    {
        expect(listReason('HelperLoopWithoutCountParserFixture.ts', 'incoming')).toContain('Data-dependent');
    });

    it('extracts a list followed by trailing scalars', () =>
    {
        expect(listShape('ListAfterCountComposerFixture.ts', 'outgoing'))
            .toBe('list<int>[int,int],string,int,int,string,string,string');
    });

    it('extracts a forEach list with separate pushes', () =>
    {
        expect(listShape('ForEachListComposerFixture.ts', 'outgoing')).toBe('list<int>[int,int,boolean]');
    });

    it('extracts three consecutive lists in order', () =>
    {
        expect(listShape('ThreeListsComposerFixture.ts', 'outgoing'))
            .toBe('int,list<int>[string,int],list<int>[int,int],list<int>[string],string');
    });

    it('extracts a spread primitive list', () =>
    {
        expect(listShape('SpreadListComposerFixture.ts', 'outgoing')).toBe('list<int>[string]');
    });

    it('extracts a spread list written in the initial literal', () =>
    {
        expect(listShape('LiteralSpreadComposerFixture.ts', 'outgoing')).toBe('int,list<int>[int],boolean');
    });

    it('keeps an imported item type unsupported', () =>
    {
        expect(listReason('ImportedItemListComposerFixture.ts', 'outgoing')).toBeDefined();
    });

    it('keeps a push inside an if unsupported', () =>
    {
        expect(listReason('PushInsideIfComposerFixture.ts', 'outgoing')).toBeDefined();
    });

    it('keeps a count without its loop unsupported', () =>
    {
        expect(listReason('CountWithoutLoopComposerFixture.ts', 'outgoing')).toBeDefined();
    });

    it('keeps the array mutated outside the constructor unsupported', () =>
    {
        expect(extractTypeScriptPacketSignature(fixture('MutatedOutgoingFixture.ts'), 'outgoing').unsupportedReason)
            .toContain('mutated with push');
    });
});

describe('TypeScript packet signature extractor', () =>
{
    it('extracts incoming wrapper reads and same-class helpers in execution order', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('IncomingFixture.ts'), 'incoming');

        expect(result.unsupportedReason).toBeUndefined();
        expect(types(result.fields)).toEqual(['int', 'string', 'short', 'boolean']);
    });

    it('extracts fields guarded by bytesAvailable as an optional trailing block', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('OptionalTrailingIncomingFixture.ts'), 'incoming');

        expect(result.unsupportedReason).toBeUndefined();
        expect(result.fields).toEqual([
            { type: 'int', name: 'id' },
            {
                type: 'optional',
                controller: 'bytesAvailable',
                fields: [{ type: 'string', name: 'figure' }]
            }
        ]);
    });

    it('extracts outgoing tuple values using their encoded wire widths', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('OutgoingFixture.ts'), 'outgoing');

        expect(result.unsupportedReason).toBeUndefined();
        expect(types(result.fields)).toEqual(['int', 'string', 'short', 'boolean']);
    });

    it('extracts a guarded optional scalar at the end of an outgoing tuple', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('OptionalOutgoingFixture.ts'), 'outgoing');

        expect(result.unsupportedReason).toBeUndefined();
        expect(result.fields).toEqual([
            { type: 'int', name: 'id' },
            { type: 'optional', controller: 'variableToken', fields: [{ type: 'string', name: 'variableToken' }] }
        ]);
    });

    it('reports the first ordered field mismatch', () =>
    {
        const expected: WireSchema[] = [
            { type: 'int', name: 'id' },
            { type: 'string', name: 'name' }
        ];
        const actual: WireSchema[] = [
            { type: 'string', name: 'name' },
            { type: 'int', name: 'id' }
        ];

        expect(() => verifyPacketContract(expected, actual, 'SEND_FIXTURE'))
            .toThrow('SEND_FIXTURE fields[0]: expected int, observed string');
    });

    it('distinguishes short from int', () =>
    {
        expect(() => verifyPacketContract(
            [{ type: 'int', name: 'id' }],
            [{ type: 'short', name: 'id' }],
            'SEND_FIXTURE'))
            .toThrow('SEND_FIXTURE fields[0]: expected int, observed short');
    });

    it('rejects unresolved packet helpers', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('UnresolvedHelperFixture.ts'), 'incoming');

        expect(result.unsupportedReason).toContain('Unresolved packet helper readMissing');
    });

    it('rejects recursive packet helpers', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('RecursiveHelperFixture.ts'), 'incoming');

        expect(result.unsupportedReason).toContain('Recursive packet helper');
    });

    it('rejects packet reads hidden behind dynamic branches', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('DynamicBranchFixture.ts'), 'incoming');

        expect(result.unsupportedReason).toContain('Data-dependent packet operations in IfStatement inside parse');
    });

    it('rejects parser fields delegated to an external constructor', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('DelegatedParserFixture.ts'), 'incoming');

        expect(result.unsupportedReason).toContain('Class Payload has no constructor');
    });

    it('rejects outgoing arrays mutated after their initial assignment', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('MutatedOutgoingFixture.ts'), 'outgoing');

        expect(result.unsupportedReason).toContain('message array _data is mutated with push');
    });
});
