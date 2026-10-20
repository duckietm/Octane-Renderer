/**
 * Packet coverage: which incoming events nothing listens to, which composers nothing sends, and
 * which used packets OctaneMessages never registers (an unregistered composer is dropped with an
 * "Unknown Composer" log, an unregistered event never fires). Grouped by the packet's folder.
 * A packet counts as used when its class name appears in the renderer outside the messages
 * folder, or in the client next to it (../Octane or ../octane) when that exists.
 *
 *   node scripts/packet-coverage.mjs
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const rendererRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const walk = (dir) => (fs.existsSync(dir)
    ? fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => (entry.isDirectory()
        ? ([ 'node_modules', 'dist', '__tests__', 'e2e' ].includes(entry.name) ? [] : walk(path.join(dir, entry.name)))
        : (/\.(ts|tsx)$/.test(entry.name) && !/\.(test|spec)\./.test(entry.name) ? [ path.join(dir, entry.name) ] : [])))
    : []);

/** Every exported class under `dir` whose name ends in `suffix`, with its first folder as the area. */
const classesIn = (dir, suffix) => walk(dir).flatMap((file) => {
    const area = path.relative(dir, path.dirname(file)).split(path.sep)[0] || '(root)';

    return [ ...fs.readFileSync(file, 'utf8').matchAll(/export class (\w+)/g) ]
        .map((match) => match[1])
        .filter((name) => name.endsWith(suffix))
        .map((name) => ({ name, area }));
});

export const packetCoverage = (root = rendererRoot) => {
    const communication = path.join(root, 'packages', 'communication', 'src');
    const messages = path.join(communication, 'messages');
    const registry = fs.readFileSync(path.join(communication, 'OctaneMessages.ts'), 'utf8');
    const client = [ '../Octane/src', '../octane/src', '../ui/src' ].map((dir) => path.resolve(root, dir)).find((dir) => fs.existsSync(dir));

    const sources = [
        ...walk(path.join(root, 'packages')).filter((file) => !file.startsWith(messages + path.sep) && !file.endsWith('OctaneMessages.ts')),
        ...(client ? walk(client) : [])
    ].map((file) => fs.readFileSync(file, 'utf8')).join('\n');

    const used = ({ name }) => new RegExp(`\\b${ name }\\b`).test(sources);
    const registered = ({ name }) => new RegExp(`\\.set\\([^,]+,\\s*${ name }\\s*\\)`).test(registry);

    const incoming = classesIn(path.join(messages, 'incoming'), 'Event');
    const outgoing = classesIn(path.join(messages, 'outgoing'), 'Composer');

    const headerKeys = [ ...registry.matchAll(/this\._(events|composers)\.set\((\w+\.\w+)\s*,/g) ].map((match) => `${ match[1] }:${ match[2] }`);
    const duplicateHeaders = [ ...new Set(headerKeys.filter((key, index) => headerKeys.indexOf(key) !== index)) ];

    return {
        client: client ?? null,
        incoming,
        outgoing,
        unusedIncoming: incoming.filter((packet) => !used(packet)),
        unusedOutgoing: outgoing.filter((packet) => !used(packet)),
        unregisteredUsed: [ ...incoming, ...outgoing ].filter((packet) => used(packet) && !registered(packet)),
        duplicateHeaders
    };
};

const byArea = (packets) => {
    const areas = {};

    for(const { name, area } of packets) (areas[area] ??= []).push(name);

    return Object.entries(areas).sort((a, b) => b[1].length - a[1].length);
};

if(process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url))
{
    const result = packetCoverage();

    console.log(result.client ? `Client: ${ result.client }` : 'Client: not found, renderer only');

    for(const [ label, packets, total ] of [
        [ 'Incoming, never listened to', result.unusedIncoming, result.incoming.length ],
        [ 'Outgoing, never sent', result.unusedOutgoing, result.outgoing.length ]
    ])
    {
        console.log(`\n## ${ label }: ${ packets.length } of ${ total }`);

        for(const [ area, names ] of byArea(packets)) console.log(`${ area } (${ names.length }): ${ names.sort().join(', ') }`);
    }

    console.log(`\n## Used but not registered in OctaneMessages: ${ result.unregisteredUsed.map(({ name }) => name).join(', ') || 'none' }`);
    console.log(`## Header registered twice: ${ result.duplicateHeaders.join(', ') || 'none' }`);

    if(result.unregisteredUsed.length || result.duplicateHeaders.length) process.exitCode = 1;
}
