import { resolve } from 'node:path';
import { describe, it } from 'vitest';
import { loadPacketContractManifest } from '../PacketContractManifest';
import { verifyPacketContract } from '../PacketContractVerifier';
import { extractTypeScriptPacketSignature } from '../TypeScriptPacketSignatureExtractor';

describe('packet contract catalog', () =>
{
    it('verifies every non-exempt TypeScript packet signature', () =>
    {
        const manifest = loadPacketContractManifest('protocol/packet-field-contracts.json');
        for(const contract of manifest.contracts)
        {
            const observed = extractTypeScriptPacketSignature(
                resolve(contract.typescript.path),
                contract.direction === 'server_to_client' ? 'incoming' : 'outgoing',
                contract.typescript.className);
            if(observed.unsupportedReason)
                throw new Error(`${ contract.name } became unsupported: ${ observed.unsupportedReason }`);
            verifyPacketContract(contract.fields, observed.fields, contract.name);
        }
    });
});
