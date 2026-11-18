import { describe, expect, it } from 'vitest';
import { WireSchema } from '../PacketContractTypes';
import { verifyPacketContract } from '../PacketContractVerifier';

const int: WireSchema = { type: 'int', name: '' };
const string: WireSchema = { type: 'string', name: '' };
const optional: WireSchema = { type: 'optional', controller: 'bytesAvailable', fields: [ string ] };
const list = (...item: WireSchema[]): WireSchema => ({ type: 'list', countType: 'int', item });

describe('packet contract verifier', () =>
{
    it('accepts a missing trailing optional at the root', () =>
    {
        expect(() => verifyPacketContract([ int, optional ], [ int ], 'P')).not.toThrow();
    });

    it('accepts a missing trailing optional inside a list item', () =>
    {
        expect(() => verifyPacketContract([ list(int, optional) ], [ list(int) ], 'P')).not.toThrow();
    });

    it('rejects a missing non-optional field', () =>
    {
        expect(() => verifyPacketContract([ int, string ], [ int ], 'P')).toThrow('expected 2 fields, observed 1');
    });

    it('rejects an extra observed field', () =>
    {
        expect(() => verifyPacketContract([ int ], [ int, int ], 'P')).toThrow();
    });
});
