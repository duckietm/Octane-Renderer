import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, relative, resolve } from 'node:path';
import { WireSchema } from './PacketContractTypes';
import { extractTypeScriptPacketSignature } from './TypeScriptPacketSignatureExtractor';
import { TypeScriptPacketRegistry } from './TypeScriptPacketRegistry';

export interface TypeScriptPacketInventoryEntry
{
    direction: 'client_to_server' | 'server_to_client';
    header: number;
    symbol: string;
    className: string;
    path: string;
    fields: readonly WireSchema[];
    unsupportedReason?: string;
}

export class PacketContractCatalogGenerator
{
    private readonly repositoryRoot: string;
    private readonly sourceRoot: string;

    constructor(repositoryRoot: string)
    {
        this.repositoryRoot = resolve(repositoryRoot);
        this.sourceRoot = resolve(this.repositoryRoot, 'packages/communication/src');
    }

    public typescriptInventory(): TypeScriptPacketInventoryEntry[]
    {
        const registry = TypeScriptPacketRegistry.discover(this.sourceRoot);
        return registry.active.map(packet =>
        {
            let fields: readonly WireSchema[] = [];
            let unsupportedReason: string | undefined;
            try
            {
                const result = extractTypeScriptPacketSignature(
                    packet.source,
                    packet.direction === 'server_to_client' ? 'incoming' : 'outgoing');
                fields = result.fields;
                unsupportedReason = result.unsupportedReason;
            }
            catch (error)
            {
                unsupportedReason = `TypeScript analyzer could not resolve packet source: ${ String(error) }`;
            }
            return {
                direction: packet.direction,
                header: packet.header,
                symbol: packet.symbol,
                className: packet.className,
                path: relative(this.repositoryRoot, packet.source).replaceAll('\\', '/'),
                fields,
                ...(unsupportedReason ? { unsupportedReason } : {})
            };
        }).sort((left, right) =>
            left.direction.localeCompare(right.direction)
            || left.header - right.header
            || left.symbol.localeCompare(right.symbol));
    }

    public writeTypeScriptInventory(destination: string): void
    {
        const path = resolve(destination);
        mkdirSync(dirname(path), { recursive: true });
        writeFileSync(path, `${ JSON.stringify(this.typescriptInventory(), null, 2) }\n`, 'utf8');
    }
}
