import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';
import { verifyPacketContract } from '../PacketContractVerifier';
import { extractTypeScriptPacketSignature } from '../TypeScriptPacketSignatureExtractor';
import { WireSchema } from '../PacketContractTypes';

const fixture = (name: string) => resolve(
    'packages/communication/src/messages/contracts/__fixtures__', name);

const types = (fields: readonly WireSchema[]) => fields.map(field => field.type);

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

        expect(result.unsupportedReason).toContain('external constructor Payload');
    });

    it('rejects outgoing arrays mutated after their initial assignment', () =>
    {
        const result = extractTypeScriptPacketSignature(fixture('MutatedOutgoingFixture.ts'), 'outgoing');

        expect(result.unsupportedReason).toContain('message array _data is mutated with push');
    });
});
