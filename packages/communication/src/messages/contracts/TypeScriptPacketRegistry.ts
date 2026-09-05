import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import ts from 'typescript';
import { PacketDirection } from './PacketContractTypes';

export interface RegisteredTypeScriptPacket
{
    direction: PacketDirection;
    header: number;
    symbol: string;
    className: string;
    source: string;
    eventSource?: string;
}

export interface DeclaredTypeScriptPacket
{
    direction: PacketDirection;
    header: number;
    symbol: string;
}

export interface DeclaredTypeScriptAlias
{
    direction: PacketDirection;
    header: number;
    canonical: string;
    symbol: string;
}

interface HeaderTable
{
    values: ReadonlyMap<string, number>;
    canonicalSymbols: ReadonlyMap<string, string>;
}

export class TypeScriptPacketRegistry
{
    public readonly active: readonly RegisteredTypeScriptPacket[];
    public readonly declaredOnly: readonly DeclaredTypeScriptPacket[];
    public readonly aliases: readonly DeclaredTypeScriptAlias[];
    private readonly byKey: ReadonlyMap<string, RegisteredTypeScriptPacket>;

    private constructor(
        active: RegisteredTypeScriptPacket[],
        declaredOnly: DeclaredTypeScriptPacket[],
        aliases: DeclaredTypeScriptAlias[])
    {
        this.active = Object.freeze([...active]);
        this.declaredOnly = Object.freeze([...declaredOnly]);
        this.aliases = Object.freeze([...aliases]);
        this.byKey = new Map(active.map(packet => [key(packet.direction, packet.header), packet]));
        Object.freeze(this);
    }

    public static discover(root: string): TypeScriptPacketRegistry
    {
        const incoming = parseHeaders(join(root, 'messages/incoming/IncomingHeader.ts'), 'IncomingHeader');
        const outgoing = parseHeaders(join(root, 'messages/outgoing/OutgoingHeader.ts'), 'OutgoingHeader');
        const eventSources = indexClasses(join(root, 'messages/incoming'));
        const parserSources = indexClasses(join(root, 'messages/parser'));
        const composerSources = indexClasses(join(root, 'messages/outgoing'));
        const registrations = parse(join(root, 'OctaneMessages.ts'));
        const discovered: RegisteredTypeScriptPacket[] = [];

        visit(registrations, node =>
        {
            if(!ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)
                || node.expression.name.text !== 'set' || node.arguments.length < 2) return;
            const header = headerReference(node.arguments[0]);
            const registeredClass = identifier(node.arguments[1]);
            if(!header || !registeredClass) return;
            if(header.owner === 'IncomingHeader')
            {
                const value = requireHeader(incoming, header.symbol, 'server_to_client');
                if(value <= 0) return;
                const eventSource = requireUniqueSource(eventSources, registeredClass);
                const parserClass = eventParser(eventSource);
                const source = requireUniqueSource(parserSources, parserClass);
                discovered.push({
                    direction: 'server_to_client', header: value, symbol: header.symbol,
                    className: parserClass, source, eventSource
                });
            }
            else if(header.owner === 'OutgoingHeader')
            {
                const value = requireHeader(outgoing, header.symbol, 'client_to_server');
                if(value <= 0) return;
                const source = requireUniqueSource(composerSources, registeredClass);
                discovered.push({
                    direction: 'client_to_server', header: value, symbol: header.symbol,
                    className: registeredClass, source
                });
            }
        });

        const byHeader = new Map<string, RegisteredTypeScriptPacket>();
        for(const packet of discovered.sort((left, right) =>
            left.direction.localeCompare(right.direction) || left.header - right.header || left.symbol.localeCompare(right.symbol)))
        {
            const packetKey = key(packet.direction, packet.header);
            const previous = byHeader.get(packetKey);
            if(previous && previous.symbol !== packet.symbol)
            {
                const table = packet.direction === 'server_to_client' ? incoming : outgoing;
                if(canonical(table, previous.symbol) !== canonical(table, packet.symbol))
                    throw new TypeError(`duplicate active ${ packet.direction } header ${ packet.header }: ${ previous.symbol } and ${ packet.symbol }`);
                if(packet.symbol === canonical(table, packet.symbol)) byHeader.set(packetKey, packet);
            }
            else byHeader.set(packetKey, packet);
        }
        validateDeclarations(incoming, 'server_to_client');
        validateDeclarations(outgoing, 'client_to_server');

        const active = [...byHeader.values()];
        const declaredOnly = [
            ...findDeclaredOnly('server_to_client', incoming, byHeader),
            ...findDeclaredOnly('client_to_server', outgoing, byHeader)
        ];
        const aliases = [
            ...findAliases('server_to_client', incoming),
            ...findAliases('client_to_server', outgoing)
        ].sort((left, right) => left.direction.localeCompare(right.direction)
            || left.header - right.header || left.symbol.localeCompare(right.symbol));
        return new TypeScriptPacketRegistry(active, declaredOnly, aliases);
    }

    public require(direction: PacketDirection, header: number): RegisteredTypeScriptPacket
    {
        const packet = this.byKey.get(key(direction, header));
        if(!packet) throw new TypeError(`no active ${ direction } packet for header ${ header }`);
        return packet;
    }
}

const parseHeaders = (path: string, owner: string): HeaderTable =>
{
    const source = parse(path);
    const expressions = new Map<string, ts.Expression>();
    visit(source, node =>
    {
        if(ts.isPropertyDeclaration(node) && node.initializer && ts.isIdentifier(node.name))
            expressions.set(node.name.text, node.initializer);
    });
    const values = new Map<string, number>();
    let changed: boolean;
    do
    {
        changed = false;
        for(const [symbol, expression] of expressions)
        {
            if(values.has(symbol)) continue;
            const reference = aliasReference(expression, owner);
            const value = integer(expression) ?? (reference ? values.get(reference) : undefined);
            if(value !== undefined)
            {
                values.set(symbol, value);
                changed = true;
            }
        }
    }
    while(changed);
    const unresolved = [...expressions.keys()].filter(symbol => !values.has(symbol));
    if(unresolved.length) throw new TypeError(`unresolved numeric header declarations in ${ path }: ${ unresolved.join(', ') }`);

    const canonicalSymbols = new Map<string, string>();
    for(const [symbol, original] of expressions)
    {
        let root = symbol;
        let expression: ts.Expression | undefined = original;
        const visited = new Set<string>();
        let reference = expression ? aliasReference(expression, owner) : undefined;
        while(reference && !visited.has(reference))
        {
            visited.add(reference);
            root = reference;
            expression = expressions.get(root);
            reference = expression ? aliasReference(expression, owner) : undefined;
        }
        canonicalSymbols.set(symbol, root);
    }
    return { values, canonicalSymbols };
};

const findAliases = (direction: PacketDirection, table: HeaderTable): DeclaredTypeScriptAlias[] =>
    [...table.values]
        .filter(([symbol]) => canonical(table, symbol) !== symbol)
        .map(([symbol, header]) => ({ direction, header, canonical: canonical(table, symbol), symbol }));

const validateDeclarations = (table: HeaderTable, direction: PacketDirection): void =>
{
    const symbolsByHeader = new Map<number, string[]>();
    for(const [symbol, header] of table.values)
    {
        if(header <= 0) throw new TypeError(`non-positive ${ direction } header ${ symbol }=${ header }`);
        const symbols = symbolsByHeader.get(header) ?? [];
        symbols.push(symbol);
        symbolsByHeader.set(header, symbols);
    }
    for(const [header, symbols] of symbolsByHeader)
    {
        if(symbols.length < 2) continue;
        const roots = new Set(symbols.map(symbol => canonical(table, symbol)));
        if(roots.size > 1)
            throw new TypeError(`duplicate declared ${ direction } header ${ header }: ${ symbols.join(' and ') }`);
    }
};

const eventParser = (eventSource: string): string =>
{
    const source = parse(eventSource);
    const importAliases = new Map<string, string>();
    for(const statement of source.statements)
    {
        if(!ts.isImportDeclaration(statement) || !statement.importClause?.namedBindings
            || !ts.isNamedImports(statement.importClause.namedBindings)) continue;
        for(const element of statement.importClause.namedBindings.elements)
            importAliases.set(element.name.text, element.propertyName?.text ?? element.name.text);
    }
    let parser: string | undefined;
    visit(source, node =>
    {
        if(parser || !ts.isCallExpression(node) || node.expression.kind !== ts.SyntaxKind.SuperKeyword
            || node.arguments.length < 2) return;
        const localName = identifier(node.arguments[1]);
        if(localName) parser = importAliases.get(localName) ?? localName;
    });
    if(!parser) throw new TypeError(`event source ${ eventSource } has no statically resolvable parser`);
    return parser;
};

const findDeclaredOnly = (
    direction: PacketDirection,
    table: HeaderTable,
    active: ReadonlyMap<string, RegisteredTypeScriptPacket>): DeclaredTypeScriptPacket[] =>
    [...table.values]
        .filter(([, header]) => header > 0)
        .filter(([symbol, header]) =>
        {
            const packet = active.get(key(direction, header));
            return !packet || canonical(table, packet.symbol) !== canonical(table, symbol);
        })
        .map(([symbol, header]) => ({ direction, header, symbol }));

const indexClasses = (root: string): Map<string, string[]> =>
{
    const result = new Map<string, string[]>();
    for(const path of walk(root).filter(path => path.endsWith('.ts')))
    {
        const source = parse(path);
        for(const statement of source.statements)
        {
            if(!ts.isClassDeclaration(statement) || !statement.name) continue;
            const name = statement.name.text;
            const existing = result.get(name) ?? [];
            existing.push(path);
            result.set(name, existing);
        }
    }
    return result;
};

const walk = (root: string): string[] =>
{
    const result: string[] = [];
    if(!existsSync(root)) return result;
    for(const entry of readdirSync(root, { withFileTypes: true }))
    {
        const path = join(root, entry.name);
        if(entry.isDirectory()) result.push(...walk(path));
        else result.push(path);
    }
    return result;
};

const requireUniqueSource = (sources: ReadonlyMap<string, string[]>, className: string): string =>
{
    const matches = sources.get(className) ?? [];
    if(!matches.length) throw new TypeError(`source for ${ className } is missing`);
    if(matches.length > 1) throw new TypeError(`source for ${ className } is ambiguous: ${ matches.join(', ') }`);
    return matches[0];
};

const requireHeader = (table: HeaderTable, symbol: string, direction: PacketDirection): number =>
{
    const header = table.values.get(symbol);
    if(header === undefined) throw new TypeError(`${ direction } symbol ${ symbol } has no numeric header declaration`);
    return header;
};

const canonical = (table: HeaderTable, symbol: string): string => table.canonicalSymbols.get(symbol) ?? symbol;

const headerReference = (expression: ts.Expression): { owner: string; symbol: string } | undefined =>
{
    if(!ts.isPropertyAccessExpression(expression) || !ts.isIdentifier(expression.expression)) return undefined;
    const owner = expression.expression.text;
    if(owner !== 'IncomingHeader' && owner !== 'OutgoingHeader') return undefined;
    return { owner, symbol: expression.name.text };
};

const identifier = (expression: ts.Expression): string | undefined =>
    ts.isIdentifier(expression) ? expression.text : undefined;

const integer = (expression: ts.Expression): number | undefined =>
{
    if(ts.isNumericLiteral(expression)) return Number(expression.text);
    if(ts.isPrefixUnaryExpression(expression) && expression.operator === ts.SyntaxKind.MinusToken
        && ts.isNumericLiteral(expression.operand)) return -Number(expression.operand.text);
    return undefined;
};

const aliasReference = (expression: ts.Expression, owner: string): string | undefined =>
{
    if(ts.isIdentifier(expression)) return expression.text;
    if(ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)
        && expression.expression.text === owner) return expression.name.text;
    return undefined;
};

const parse = (path: string): ts.SourceFile =>
    ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);

const visit = (node: ts.Node, action: (node: ts.Node) => void): void =>
{
    action(node);
    node.forEachChild(child => visit(child, action));
};

const key = (direction: PacketDirection, header: number): string => `${ direction }:${ header }`;
