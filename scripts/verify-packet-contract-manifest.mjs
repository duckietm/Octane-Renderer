import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const argumentsList = process.argv.slice(2);
const emulatorIndex = argumentsList.indexOf('--emulator');
if(emulatorIndex < 0 || !argumentsList[emulatorIndex + 1])
{
    console.error('Usage: node scripts/verify-packet-contract-manifest.mjs --emulator <repository-path>');
    process.exit(2);
}

const rendererManifestPath = fileURLToPath(new URL('../protocol/packet-field-contracts.json', import.meta.url));
const emulatorManifestPath = resolve(argumentsList[emulatorIndex + 1], 'protocol/packet-field-contracts.json');
const normalizeLineEndings = bytes => Buffer.from(bytes.toString('utf8').replace(/\r\n/g, '\n'));
const rendererBytes = normalizeLineEndings(readFileSync(rendererManifestPath));
const emulatorBytes = normalizeLineEndings(readFileSync(emulatorManifestPath));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
const rendererHash = hash(rendererBytes);
const emulatorHash = hash(emulatorBytes);

if(!rendererBytes.equals(emulatorBytes))
{
    console.error(`Packet contract manifests differ: renderer=${ rendererHash } emulator=${ emulatorHash }`);
    process.exit(1);
}

// The coverage ratchet and its exceptions are kept identical in both repositories too. An emulator
// branch from before the ratchet has no copy yet: that is reported, not failed.
for(const sharedPath of [ 'scripts/packet-contract-ratchet.mjs', 'protocol/packet-contract-ratchet-exceptions.json' ])
{
    const emulatorPath = resolve(argumentsList[emulatorIndex + 1], sharedPath);
    if(!existsSync(emulatorPath))
    {
        console.warn(`Emulator has no ${ sharedPath } yet; not compared`);
        continue;
    }
    const rendererShared = normalizeLineEndings(readFileSync(fileURLToPath(new URL(`../${ sharedPath }`, import.meta.url))));
    if(!rendererShared.equals(normalizeLineEndings(readFileSync(emulatorPath))))
    {
        console.error(`${ sharedPath } differs between renderer and emulator`);
        process.exit(1);
    }
}

const manifest = JSON.parse(rendererBytes.toString('utf8'));
console.log(
    `Packet contract manifests match (${ rendererHash }): ` +
    `${ manifest.contracts.length } verified, ${ manifest.unpaired.length } unpaired, ` +
    `${ manifest.exemptions.length } exempt`);
