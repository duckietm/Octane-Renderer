import { existsSync, readFileSync } from 'node:fs';
import { dirname, join, resolve as resolvePath, sep } from 'node:path';
import ts from 'typescript';
import { ScalarSchema, ScalarType, WireSchema } from './PacketContractTypes';

export type TypeScriptPacketSide = 'incoming' | 'outgoing';

export interface TypeScriptExtractionResult
{
    fields: readonly WireSchema[];
    unsupportedReason?: string;
}

const READ_TYPES: Readonly<Record<string, ScalarType>> = {
    readByte: 'byte',
    readShort: 'short',
    readInt: 'int',
    readLong: 'long',
    readBoolean: 'boolean',
    readString: 'string',
    readBytes: 'bytes'
};

/** `className` picks the packet class when a file declares several; without it the first class is used. */
export const extractTypeScriptPacketSignature = (
    path: string,
    side: TypeScriptPacketSide,
    className?: string): TypeScriptExtractionResult =>
{
    const source = sourceFile(path);
    const classes = source.statements.filter(ts.isClassDeclaration);
    const packetClass = (className && classes.find(declaration => declaration.name?.text === className)) || classes[0];
    if(!packetClass) return unsupported(`No packet class found in ${ path }`);
    return side === 'incoming' ? extractIncoming(packetClass) : extractOutgoing(packetClass);
};

const sources = new Map<string, ts.SourceFile>();

const sourceFile = (path: string): ts.SourceFile =>
{
    const absolute = resolvePath(path);
    let source = sources.get(absolute);
    if(!source)
    {
        source = ts.createSourceFile(absolute, readFileSync(absolute, 'utf8'), ts.ScriptTarget.Latest, true);
        sources.set(absolute, source);
    }
    return source;
};

const extractIncoming = (packetClass: ts.ClassDeclaration): TypeScriptExtractionResult =>
{
    const root = classMethods(packetClass).methods.get('parse');
    if(!root) return unsupported('Incoming parser has no parse method');
    return extractIncomingFunction(root, []);
};

type ReaderFunction = ts.FunctionLikeDeclaration;

const functionName = (reader: ReaderFunction): string =>
{
    if(ts.isConstructorDeclaration(reader)) return `${ (reader.parent as ts.ClassDeclaration).name?.text ?? 'class' } constructor`;
    if(reader.name) return reader.name.getText();
    if(ts.isVariableDeclaration(reader.parent) && ts.isIdentifier(reader.parent.name)) return reader.parent.name.text;
    return 'function';
};

/** The methods with a body of the class around a node; a name with several bodies is ambiguous. */
const classMethods = (node: ts.Node): { methods: Map<string, ts.MethodDeclaration>; overloaded: Set<string> } =>
{
    const methods = new Map<string, ts.MethodDeclaration>();
    const overloaded = new Set<string>();
    const owner = ts.isClassDeclaration(node) ? node : findAncestor(node, ts.isClassDeclaration);
    for(const member of owner?.members ?? [])
    {
        if(!ts.isMethodDeclaration(member) || !member.body) continue;
        const name = member.name.getText();
        if(methods.has(name)) overloaded.add(name);
        methods.set(name, member);
    }
    return { methods, overloaded };
};

const extractIncomingFunction = (reader: ReaderFunction, stack: readonly string[]): TypeScriptExtractionResult =>
{
    const name = functionName(reader);
    const id = `${ reader.getSourceFile().fileName }:${ reader.getStart() }`;
    if(stack.includes(id)) return unsupported(`Recursive packet helper ${ name }`);
    if(!reader.body) return unsupported(`Packet reader ${ name } has no body`);
    const { methods, overloaded } = classMethods(reader);
    const loops = incomingListLoops(reader);
    const dynamic = dynamicPacketFlow(reader, methods, loops);
    if(dynamic) return unsupported(dynamic);

    const scoped = extractIncomingScope(reader.body, { methods, overloaded, stack: [...stack, id], loops });
    if(typeof scoped === 'string') return unsupported(scoped);
    const fields: WireSchema[] = [];
    const optionalGuard = trailingOptionalGuard(reader);
    const optionalFields: WireSchema[] = [];
    for(const { field, position } of scoped)
        (optionalGuard && position > optionalGuard.position ? optionalFields : fields).push(field);
    if(optionalGuard && optionalFields.length)
        fields.push({ type: 'optional', controller: optionalGuard.controller, fields: optionalFields });
    return { fields };
};

interface ListLoop
{
    loop: ts.Statement;
    countType: ScalarType;
    body: ts.Statement;
}

interface IncomingScopeContext
{
    methods: ReadonlyMap<string, ts.MethodDeclaration>;
    overloaded: ReadonlySet<string>;
    stack: readonly string[];
    loops: ReadonlyMap<ts.CallExpression, ListLoop>;
    inList?: boolean;
}

interface PositionedField
{
    field: WireSchema;
    position: number;
}

/** The reads inside one scope: the method body, or the body of a recognised list loop. Returns a reason when unsupported. */
const extractIncomingScope = (scope: ts.Node, context: IncomingScopeContext): PositionedField[] | string =>
{
    const loopNodes = new Set<ts.Node>([ ...context.loops.values() ].map(loop => loop.loop));
    const calls: (ts.CallExpression | ts.NewExpression)[] = [];
    visit(scope, node =>
    {
        if(ts.isCallExpression(node) || ts.isNewExpression(node)) calls.push(node);
    });
    calls.sort((left, right) => left.getStart() - right.getStart());
    const fields: PositionedField[] = [];
    // Calls already described as a whole (Array.from lists, delegates): nothing inside them is read again.
    const consumed = new Set<ts.Node>();
    for(const node of calls)
    {
        if(insideLoopOf(node, scope, loopNodes) || insideLoopOf(node, scope, consumed)) continue;
        const position = node.getStart();
        const wrappers = wrapperNames(node);
        if(ts.isNewExpression(node) || !localHelperName(node) && !readCall(node) && receivesWrapper(node, wrappers))
        {
            if(ts.isNewExpression(node) && !receivesWrapper(node, wrappers)) continue;
            consumed.add(node);
            const delegated = extractDelegate(node, context.stack);
            if(typeof delegated === 'string') return delegated;
            delegated.forEach(field => fields.push({ field, position }));
            continue;
        }
        const call = node;
        const arrayFrom = arrayFromList(call);
        if(arrayFrom)
        {
            consumed.add(call);
            const item = extractIncomingScope(arrayFrom.item, { ...context, inList: true });
            if(typeof item === 'string') return item;
            if(!item.length) return 'List item reads nothing statically';
            fields.push({ field: { type: 'list', countType: arrayFrom.countType, item: item.map(entry => entry.field) }, position });
            continue;
        }
        const loop = context.loops.get(call);
        if(loop)
        {
            const item = extractIncomingScope(loop.body, { ...context, inList: true });
            if(typeof item === 'string') return item;
            if(!item.length) return 'List item reads nothing statically';
            fields.push({ field: { type: 'list', countType: loop.countType, item: item.map(entry => entry.field) }, position });
            continue;
        }
        const read = readCall(call);
        if(read)
        {
            // Outside a list a conditional read keeps its old reading; inside one it would misdescribe every item.
            if(context.inList && insideConditionalExpression(call, scope)) return `Conditional packet read ${ call.getText() } inside a list item`;
            fields.push({ field: { type: read, name: inferredName(call) }, position });
            continue;
        }
        if(ts.isPropertyAccessExpression(call.expression) && ts.isIdentifier(call.expression.expression)
            && wrappers.has(call.expression.expression.text) && /^read/.test(call.expression.name.text))
            return `Unknown packet read ${ call.expression.name.text }`;
        const helperName = localHelperName(call);
        if(!helperName) continue;
        if(!context.methods.has(helperName))
        {
            if(/^(read|parse)/i.test(helperName)) return `Unresolved packet helper ${ helperName }`;
            continue;
        }
        if(context.overloaded.has(helperName)) return `Overloaded packet helper ${ helperName } cannot be resolved safely`;
        const helper = extractIncomingFunction(context.methods.get(helperName), context.stack);
        if(helper.unsupportedReason) return helper.unsupportedReason;
        helper.fields.forEach(field => fields.push({ field, position }));
    }
    return fields;
};

/**
 * The parameter names of every function around a node: the names the packet wrapper goes by there. A callback
 * (Array.from, forEach) sees the wrapper of the function it sits in.
 */
const wrapperNames = (node: ts.Node): ReadonlySet<string> =>
{
    const names = new Set<string>();
    for(let current = node.parent; current; current = current.parent)
        if(ts.isFunctionLike(current)) current.parameters.forEach(parameter => names.add(parameter.name.getText()));
    return names;
};

const receivesWrapper = (node: ts.CallExpression | ts.NewExpression, wrappers: ReadonlySet<string>): boolean =>
    (node.arguments ?? []).some(argument => ts.isIdentifier(unwrap(argument)) && wrappers.has((unwrap(argument) as ts.Identifier).text));

/** `Array.from({ length: wrapper.readInt() }, () => item)`: a list whose item is what the callback reads. */
const arrayFromList = (call: ts.CallExpression): { countType: ScalarType; item: ts.Node } | undefined =>
{
    if(call.expression.getText() !== 'Array.from' || call.arguments.length !== 2) return undefined;
    const [ shape, callback ] = call.arguments;
    if(!ts.isObjectLiteralExpression(shape) || shape.properties.length !== 1) return undefined;
    const length = shape.properties[0];
    if(!ts.isPropertyAssignment(length) || length.name.getText() !== 'length') return undefined;
    const count = unwrap(length.initializer);
    const countType = ts.isCallExpression(count) ? readCall(count) : undefined;
    if(countType !== 'int' && countType !== 'short') return undefined;
    if(!ts.isArrowFunction(callback) && !ts.isFunctionExpression(callback)) return undefined;
    return { countType, item: callback.body };
};

/**
 * The fields read by the function a call or `new` hands the wrapper to: a constructor, a static or instance
 * method, `super.parse`, or a module function, in this file or an imported one. A reason when it cannot be
 * resolved exactly, or when the delegate ends with an optional tail (that would sit in the middle of the packet).
 */
const extractDelegate = (node: ts.CallExpression | ts.NewExpression, stack: readonly string[]): readonly WireSchema[] | string =>
{
    const reader = resolveDelegate(node);
    if(typeof reader === 'string') return reader;
    const result = extractIncomingFunction(reader, stack);
    if(result.unsupportedReason) return result.unsupportedReason;
    if(result.fields.some(field => field.type === 'optional'))
        return `Optional tail inside the delegated reader ${ functionName(reader) }`;
    return result.fields;
};

const resolveDelegate = (node: ts.CallExpression | ts.NewExpression): ReaderFunction | string =>
{
    const label = node.expression.getText();
    const unresolved = `Packet fields delegated to external reader ${ label } cannot be resolved`;
    if(ts.isNewExpression(node))
    {
        if(!ts.isIdentifier(node.expression)) return unresolved;
        const owner = resolveDeclaration(node.expression.text, node.getSourceFile());
        if(typeof owner === 'string') return owner;
        if(!ts.isClassDeclaration(owner)) return unresolved;
        return constructorOf(owner) ?? `Class ${ label } has no constructor that reads the packet`;
    }
    const target = node.expression;
    if(ts.isIdentifier(target))
    {
        const declaration = resolveDeclaration(target.text, node.getSourceFile());
        if(typeof declaration === 'string') return declaration;
        return functionOf(declaration) ?? unresolved;
    }
    if(!ts.isPropertyAccessExpression(target)) return unresolved;
    const method = target.name.text;
    const receiver = target.expression;
    if(receiver.kind === ts.SyntaxKind.SuperKeyword)
    {
        const owner = findAncestor(node, ts.isClassDeclaration);
        const base = owner && baseClass(owner);
        if(typeof base === 'string') return base;
        return base ? instanceMethod(base, method) : unresolved;
    }
    if(ts.isIdentifier(receiver))
    {
        const declared = resolveDeclaration(receiver.text, node.getSourceFile());
        if(typeof declared !== 'string' && ts.isClassDeclaration(declared))
        {
            const found = declared.members.find((member): member is ts.MethodDeclaration => ts.isMethodDeclaration(member)
                && member.name.getText() === method && !!member.body
                && !!ts.getModifiers(member)?.some(modifier => modifier.kind === ts.SyntaxKind.StaticKeyword));
            return found ?? unresolved;
        }
    }
    const type = receiverClass(receiver);
    if(typeof type === 'string') return type;
    return type ? instanceMethod(type, method) : unresolved;
};

/** The class of `x` or `this.x` from `new X()` or a declared type `X`, in the function or class around it. */
const receiverClass = (receiver: ts.Expression): ts.ClassDeclaration | string | undefined =>
{
    let declaration: ts.VariableDeclaration | ts.PropertyDeclaration | ts.ParameterDeclaration | undefined;
    if(ts.isIdentifier(receiver))
    {
        const reader = findAncestor(receiver, ts.isFunctionLike);
        visit(reader, node =>
        {
            if(!declaration && (ts.isVariableDeclaration(node) || ts.isParameter(node))
                && ts.isIdentifier(node.name) && node.name.text === receiver.text) declaration = node;
        });
    }
    else if(ts.isPropertyAccessExpression(receiver) && receiver.expression.kind === ts.SyntaxKind.ThisKeyword)
    {
        const owner = findAncestor(receiver, ts.isClassDeclaration);
        declaration = owner?.members.find((member): member is ts.PropertyDeclaration => ts.isPropertyDeclaration(member)
            && member.name.getText() === receiver.name.text);
    }
    if(!declaration) return undefined;
    const initializer = declaration.initializer && unwrap(declaration.initializer);
    const name = initializer && ts.isNewExpression(initializer) && ts.isIdentifier(initializer.expression)
        ? initializer.expression.text
        : declaration.type && ts.isTypeReferenceNode(declaration.type) && !declaration.type.typeArguments
            ? declaration.type.typeName.getText()
            : undefined;
    if(!name) return undefined;
    const resolved = resolveDeclaration(name, receiver.getSourceFile());
    if(typeof resolved === 'string') return resolved;
    return ts.isClassDeclaration(resolved) ? resolved : undefined;
};

const isAbstract = (node: ts.Node): boolean =>
    !!ts.canHaveModifiers(node) && !!ts.getModifiers(node)?.some(modifier => modifier.kind === ts.SyntaxKind.AbstractKeyword);

/** An instance method, looked up through the base classes; abstract classes and methods are refused. */
const instanceMethod = (owner: ts.ClassDeclaration, method: string): ReaderFunction | string =>
{
    for(let current: ts.ClassDeclaration | string | undefined = owner, depth = 0; current && depth < 6; depth++)
    {
        if(typeof current === 'string') return current;
        if(isAbstract(current)) return `Class ${ current.name?.text } is abstract: its ${ method } cannot be resolved exactly`;
        const found = current.members.find((member): member is ts.MethodDeclaration => ts.isMethodDeclaration(member)
            && member.name.getText() === method && !!member.body);
        if(found) return found;
        current = baseClass(current);
    }
    return `Method ${ method } of ${ owner.name?.text } cannot be resolved`;
};

const constructorOf = (owner: ts.ClassDeclaration): ReaderFunction | undefined =>
{
    for(let current: ts.ClassDeclaration | string | undefined = owner, depth = 0; current && typeof current !== 'string' && depth < 6; depth++)
    {
        const found = current.members.find((member): member is ts.ConstructorDeclaration => ts.isConstructorDeclaration(member) && !!member.body);
        if(found) return found;
        current = baseClass(current);
    }
    return undefined;
};

const baseClass = (owner: ts.ClassDeclaration): ts.ClassDeclaration | string | undefined =>
{
    const heritage = owner.heritageClauses?.find(clause => clause.token === ts.SyntaxKind.ExtendsKeyword)?.types[0];
    if(!heritage || !ts.isIdentifier(heritage.expression)) return undefined;
    const resolved = resolveDeclaration(heritage.expression.text, owner.getSourceFile());
    if(typeof resolved === 'string') return resolved;
    return ts.isClassDeclaration(resolved) ? resolved : undefined;
};

const functionOf = (declaration: ts.Node): ReaderFunction | undefined =>
{
    if(ts.isFunctionDeclaration(declaration) && declaration.body) return declaration;
    if(ts.isVariableDeclaration(declaration) && declaration.initializer)
    {
        const value = unwrap(declaration.initializer);
        if(ts.isArrowFunction(value) || ts.isFunctionExpression(value)) return value;
    }
    return undefined;
};

/** A top-level class, function or variable of a file, by name. */
const topLevel = (source: ts.SourceFile, name: string): ts.Node | undefined =>
{
    for(const statement of source.statements)
    {
        if((ts.isClassDeclaration(statement) || ts.isFunctionDeclaration(statement)) && statement.name?.text === name) return statement;
        if(ts.isVariableStatement(statement))
        {
            const found = statement.declarationList.declarations.find(declaration => ts.isIdentifier(declaration.name)
                && declaration.name.text === name);
            if(found) return found;
        }
    }
    return undefined;
};

/** A name used in a file: declared there, or imported through relative paths, barrels and @octane packages. */
const resolveDeclaration = (name: string, source: ts.SourceFile): ts.Node | string =>
{
    const local = topLevel(source, name);
    if(local) return local;
    for(const statement of source.statements)
    {
        if(!ts.isImportDeclaration(statement) || !statement.importClause?.namedBindings
            || !ts.isNamedImports(statement.importClause.namedBindings)) continue;
        const element = statement.importClause.namedBindings.elements.find(candidate => candidate.name.text === name);
        if(!element) continue;
        const file = resolveModule((statement.moduleSpecifier as ts.StringLiteral).text, source.fileName);
        if(!file) return `Module ${ (statement.moduleSpecifier as ts.StringLiteral).text } of ${ name } cannot be resolved`;
        const found = findExport(file, element.propertyName?.text ?? name, 0);
        return found.length === 1 ? found[0] : found.length ? `${ name } is exported twice` : `${ name } cannot be resolved`;
    }
    return `${ name } cannot be resolved`;
};

const exportsCache = new Map<string, ts.Node[]>();

/** The declarations a file exports under a name, following `export *` and `export { } from`. */
const findExport = (file: string, name: string, depth: number): ts.Node[] =>
{
    const key = `${ file }#${ name }`;
    const cached = exportsCache.get(key);
    if(cached) return cached;
    if(depth > 6) return [];
    const source = sourceFile(file);
    const found = new Set<ts.Node>();
    const local = topLevel(source, name);
    if(local) found.add(local);
    for(const statement of source.statements)
    {
        if(!ts.isExportDeclaration(statement) || !statement.moduleSpecifier) continue;
        const target = resolveModule((statement.moduleSpecifier as ts.StringLiteral).text, file);
        if(!target) continue;
        if(!statement.exportClause) findExport(target, name, depth + 1).forEach(node => found.add(node));
        else if(ts.isNamedExports(statement.exportClause))
        {
            const element = statement.exportClause.elements.find(candidate => candidate.name.text === name);
            if(element) findExport(target, element.propertyName?.text ?? name, depth + 1).forEach(node => found.add(node));
        }
    }
    const result = [ ...found ];
    exportsCache.set(key, result);
    return result;
};

const resolveModule = (specifier: string, from: string): string | undefined =>
{
    let base: string | undefined;
    if(specifier.startsWith('.')) base = resolvePath(dirname(from), specifier);
    else if(specifier.startsWith('@octane/'))
    {
        const marker = `${ sep }packages${ sep }`;
        const index = from.lastIndexOf(marker);
        if(index < 0) return undefined;
        base = join(from.slice(0, index), 'packages', specifier.slice('@octane/'.length), 'src', 'index');
    }
    if(!base) return undefined;
    return [ `${ base }.ts`, `${ base }.tsx`, join(base, 'index.ts') ].find(candidate => existsSync(candidate));
};

const findAncestor = <T extends ts.Node>(node: ts.Node, predicate: (node: ts.Node) => node is T): T | undefined =>
{
    for(let current = node.parent; current; current = current.parent)
        if(predicate(current)) return current;
    return undefined;
};

const insideConditionalExpression = (node: ts.Node, scope: ts.Node): boolean =>
{
    for(let current = node.parent; current && current !== scope; current = current.parent)
    {
        if(ts.isConditionalExpression(current)) return true;
        if(ts.isBinaryExpression(current) && [ ts.SyntaxKind.AmpersandAmpersandToken, ts.SyntaxKind.BarBarToken,
            ts.SyntaxKind.QuestionQuestionToken ].includes(current.operatorToken.kind)) return true;
    }
    return false;
};

const insideLoopOf = (node: ts.Node, scope: ts.Node, loopNodes: ReadonlySet<ts.Node>): boolean =>
{
    for(let current = node.parent; current && current !== scope; current = current.parent)
        if(loopNodes.has(current)) return true;
    return false;
};

/**
 * Loops read as a list: `const n = wrapper.readInt()` (or readShort) followed by a loop that runs n times,
 * keyed by the call that reads the count. `let i = 0` and guards that read nothing may sit between them.
 * Anything else stays a data-dependent loop.
 */
const incomingListLoops = (method: ReaderFunction): Map<ts.CallExpression, ListLoop> =>
{
    const loops = new Map<ts.CallExpression, ListLoop>();
    visit(method.body, node =>
    {
        if(!ts.isForStatement(node) && !ts.isWhileStatement(node)) return;
        const body = node.statement;
        if(containsNode(body, child => ts.isBreakStatement(child) || ts.isContinueStatement(child) || ts.isReturnStatement(child))) return;
        if(!ts.isBlock(node.parent)) return;
        const siblings = node.parent.statements;
        const zeroed = new Set<string>();
        let index = siblings.indexOf(node) - 1;
        for(; index >= 0; index--)
        {
            const sibling = siblings[index];
            const zero = zeroDeclaration(sibling);
            if(zero) zeroed.add(zero);
            else if(!ts.isIfStatement(sibling) || containsNode(sibling, child => ts.isCallExpression(child)
                && (readCall(child) !== undefined || localHelperName(child) !== undefined))) break;
        }
        const count = index >= 0 ? countDeclaration(siblings[index]) : undefined;
        if(!count) return;
        if(!runsCountTimes(node, count.name, zeroed)) return;
        loops.set(count.call, { loop: node, countType: count.type, body });
    });
    return loops;
};

const countDeclaration = (statement: ts.Statement): { name: string; call: ts.CallExpression; type: ScalarType } | undefined =>
{
    if(!ts.isVariableStatement(statement) || statement.declarationList.declarations.length !== 1) return undefined;
    const declaration = statement.declarationList.declarations[0];
    if(!ts.isIdentifier(declaration.name) || !declaration.initializer) return undefined;
    const initializer = unwrap(declaration.initializer);
    if(!ts.isCallExpression(initializer)) return undefined;
    const type = readCall(initializer);
    if(type !== 'int' && type !== 'short') return undefined;
    return { name: declaration.name.text, call: initializer, type };
};

const zeroDeclaration = (statement: ts.Statement): string | undefined =>
{
    if(!ts.isVariableStatement(statement) || statement.declarationList.declarations.length !== 1) return undefined;
    const declaration = statement.declarationList.declarations[0];
    if(!ts.isIdentifier(declaration.name) || declaration.initializer?.getText() !== '0') return undefined;
    return declaration.name.text;
};

/** `for(let i = 0; i < n; i++)`, `while(i < n) { ...; i++ }`, `while(n > 0) { ...; n-- }` or `while(n-- > 0)`. */
const runsCountTimes = (loop: ts.ForStatement | ts.WhileStatement, count: string, zeroed: ReadonlySet<string>): boolean =>
{
    const statements = ts.isBlock(loop.statement) ? [ ...loop.statement.statements ] : [ loop.statement ];
    const mentionsCount = (nodes: readonly ts.Node[]) => nodes.some(node => containsNode(node,
        child => ts.isIdentifier(child) && child.text === count));
    const isStep = (node: ts.Node | undefined, name: string, operator: ts.SyntaxKind): boolean =>
    {
        if(!node) return false;
        const expression = ts.isExpressionStatement(node) ? node.expression : node;
        return (ts.isPostfixUnaryExpression(expression) || ts.isPrefixUnaryExpression(expression))
            && expression.operator === operator && expression.operand.getText() === name;
    };
    const condition = loop.kind === ts.SyntaxKind.ForStatement ? loop.condition : loop.expression;
    if(!condition || !ts.isBinaryExpression(condition)) return false;
    const left = condition.left.getText();
    const right = condition.right.getText();
    const operator = condition.operatorToken.kind;

    if(ts.isForStatement(loop))
    {
        const initializer = loop.initializer;
        if(!initializer || !ts.isVariableDeclarationList(initializer) || initializer.declarations.length !== 1) return false;
        const index = initializer.declarations[0];
        if(!ts.isIdentifier(index.name) || index.initializer?.getText() !== '0') return false;
        return operator === ts.SyntaxKind.LessThanToken && left === index.name.text && right === count
            && isStep(loop.incrementor, index.name.text, ts.SyntaxKind.PlusPlusToken)
            && !mentionsCount(statements);
    }
    if(operator === ts.SyntaxKind.LessThanToken && zeroed.has(left) && right === count)
        return isStep(statements.at(-1), left, ts.SyntaxKind.PlusPlusToken) && !mentionsCount(statements);
    if(operator === ts.SyntaxKind.GreaterThanToken && left === count && right === '0')
        return isStep(statements.at(-1), count, ts.SyntaxKind.MinusMinusToken) && !mentionsCount(statements.slice(0, -1));
    if(operator === ts.SyntaxKind.GreaterThanToken && left === `${ count }--` && right === '0')
        return !mentionsCount(statements);
    return false;
};


const containsNode = (node: ts.Node, predicate: (node: ts.Node) => boolean): boolean =>
{
    let found = false;
    visit(node, child =>
    {
        if(!found && predicate(child)) found = true;
    });
    return found;
};

const trailingOptionalGuard = (
    method: ReaderFunction): { controller: string; position: number } | undefined =>
{
    const body = method.body && ts.isBlock(method.body) ? method.body.statements : [];
    for(const statement of body)
    {
        if(!ts.isIfStatement(statement)) continue;
        const expression = unwrap(statement.expression);
        if(!ts.isPrefixUnaryExpression(expression)
            || expression.operator !== ts.SyntaxKind.ExclamationToken
            || !ts.isPropertyAccessExpression(unwrap(expression.operand))) continue;
        const property = unwrap(expression.operand) as ts.PropertyAccessExpression;
        if(property.name.text !== 'bytesAvailable') continue;
        const guarded = ts.isBlock(statement.thenStatement)
            ? statement.thenStatement.statements
            : [statement.thenStatement];
        if(!guarded.some(ts.isReturnStatement)) continue;
        return { controller: property.name.text, position: statement.getEnd() };
    }
    return undefined;
};

const extractOutgoing = (packetClass: ts.ClassDeclaration): TypeScriptExtractionResult =>
{
    const constructor = packetClass.members.find(ts.isConstructorDeclaration);
    const method = packetClass.members.find(member => ts.isMethodDeclaration(member)
        && member.name.getText() === 'getMessageArray') as ts.MethodDeclaration | undefined;
    if(!method?.body) return unsupported('Outgoing composer has no getMessageArray method');
    const returnStatement = method.body.statements.find(ts.isReturnStatement);
    if(!returnStatement?.expression) return unsupported('Outgoing composer getMessageArray has no returned value');
    const returnedName = propertyName(returnStatement.expression);
    if(constructor?.body && returnedName && ts.isPropertyAccessExpression(unwrap(returnStatement.expression))
        && !trailingOptionalPush(constructor, returnedName))
    {
        const sequence = extractConstructorSequence(packetClass, constructor, returnedName);
        if(sequence) return sequence;
    }
    let array = unwrapArray(returnStatement.expression);
    if(!array && constructor?.body)
    {
        if(returnedName)
        {
            for(const statement of constructor.body.statements)
            {
                if(!ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression)) continue;
                const assignment = statement.expression;
                if(assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken
                    || propertyName(assignment.left) !== returnedName) continue;
                array = unwrapArray(assignment.right);
                if(array) break;
            }
        }
    }
    if(!array) return unsupported('Outgoing composer message array cannot be resolved statically');
    const optionalPush = constructor && returnedName ? trailingOptionalPush(constructor, returnedName) : undefined;
    if(returnedName)
    {
        let mutator: string | undefined;
        visit(packetClass, node =>
        {
            if(mutator || !ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;
            const methodName = node.expression.name.text;
            if(!['push', 'unshift', 'splice'].includes(methodName)) return;
            if(propertyName(node.expression.expression) === returnedName && node !== optionalPush) mutator = methodName;
        });
        if(mutator) return unsupported(`Outgoing message array ${ returnedName } is mutated with ${ mutator }`);
    }

    const parameters = new Map<string, ts.ParameterDeclaration>();
    constructor?.parameters.forEach(parameter => parameters.set(parameter.name.getText(), parameter));
    const fields: WireSchema[] = [];
    for(const expression of array.elements)
    {
        const inferred = outgoingField(expression, parameters);
        if(typeof inferred === 'string') return unsupported(inferred);
        fields.push(inferred);
    }
    if(optionalPush)
    {
        const field = outgoingField(optionalPush.arguments[0], parameters);
        if(typeof field === 'string') return unsupported(field);
        fields.push({ type: 'optional', controller: field.name, fields: [field] });
    }
    return { fields };
};

/**
 * A message array built in the constructor by pushing in order: a literal, then pushes of scalars, where
 * `xs.length` (last value of a literal or push) is followed at once by a loop over `xs` that only pushes, or
 * `push(xs.length, ...xs)` for a primitive array. Returns undefined when the constructor does not push to the
 * array at all, so the plain literal path applies.
 */
const extractConstructorSequence = (
    packetClass: ts.ClassDeclaration,
    constructor: ts.ConstructorDeclaration,
    returnedName: string): TypeScriptExtractionResult | undefined =>
{
    const statements = constructor.body.statements;
    let start = -1;
    let arrayName = returnedName;
    let initial: ts.ArrayLiteralExpression | undefined;
    for(let index = 0; index < statements.length && start < 0; index++)
    {
        const statement = statements[index];
        const assigned = assignedArray(statement, returnedName);
        if(assigned)
        {
            start = index;
            initial = assigned;
        }
        else if(ts.isVariableStatement(statement) && statement.declarationList.declarations.length === 1)
        {
            const declaration = statement.declarationList.declarations[0];
            const literal = declaration.initializer && unwrapArray(declaration.initializer);
            const local = ts.isIdentifier(declaration.name) ? declaration.name.text : undefined;
            if(literal && local && statements.some(later => isAliasAssignment(later, returnedName, local)))
            {
                start = index;
                initial = literal;
                arrayName = local;
            }
        }
    }
    if(start < 0) return undefined;
    const pushes = (node: ts.Node) => containsNode(node, child => isPushOn(child, arrayName));
    // Neither a push nor a count in the literal: the plain literal path applies, as before.
    if(!statements.some(pushes) && !initial.elements.some(element => countOf(element))) return undefined;

    let mutatedElsewhere = false;
    visit(packetClass, node =>
    {
        if(isPushOn(node, returnedName) && !constructor.body.statements.some(statement => containsNode(statement, child => child === node)))
            mutatedElsewhere = true;
    });
    if(mutatedElsewhere) return unsupported(`Outgoing message array ${ returnedName } is mutated outside the constructor`);

    const parameters = new Map<string, ts.ParameterDeclaration>();
    constructor.parameters.forEach(parameter => parameters.set(parameter.name.getText(), parameter));
    const source = packetClass.getSourceFile();
    const fields: WireSchema[] = [];
    let pending: { collection: string; type: ScalarType } | undefined;

    const addValues = (values: readonly ts.Expression[]): string | undefined =>
    {
        for(let index = 0; index < values.length; index++)
        {
            const value = values[index];
            const last = index === values.length - 1;
            const count = countOf(value);
            if(count)
            {
                const next = values[index + 1];
                if(next && ts.isSpreadElement(next) && next.expression.getText() === count.collection)
                {
                    const element = elementType(count.collection, parameters);
                    const type = element ? wireType(element) : undefined;
                    if(!type) return `Outgoing list ${ count.collection } has no statically resolvable item type`;
                    fields.push({ type: 'list', countType: count.type, item: [ { type, name: '' } ] });
                    index++;
                    continue;
                }
                if(!last) return `Outgoing count ${ value.getText() } is not followed by its loop`;
                pending = count;
                continue;
            }
            if(ts.isSpreadElement(value)) return `Outgoing spread ${ value.getText() } has no count before it`;
            const field = outgoingField(value, parameters);
            if(typeof field === 'string') return field;
            fields.push(field);
        }
        return undefined;
    };

    const initialReason = addValues(initial.elements);
    if(initialReason) return unsupported(initialReason);
    for(const statement of statements.slice(start + 1))
    {
        if(pending)
        {
            const item = listItem(statement, pending.collection, arrayName, parameters, source);
            if(typeof item === 'string') return unsupported(item);
            fields.push({ type: 'list', countType: pending.type, item });
            pending = undefined;
            continue;
        }
        if(isAliasAssignment(statement, returnedName, arrayName)) continue;
        const push = pushStatement(statement, arrayName);
        if(!push) return unsupported(`Outgoing composer statement ${ statement.getText().split('\n')[0] } cannot be resolved statically`);
        const reason = addValues(push.arguments);
        if(reason) return unsupported(reason);
    }
    if(pending) return unsupported(`Outgoing count ${ pending.collection }.length is not followed by its loop`);
    return { fields };
};

const assignedArray = (statement: ts.Statement, returnedName: string): ts.ArrayLiteralExpression | undefined =>
{
    if(!ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression)) return undefined;
    const assignment = statement.expression;
    if(assignment.operatorToken.kind !== ts.SyntaxKind.EqualsToken || !ts.isPropertyAccessExpression(unwrap(assignment.left))
        || propertyName(assignment.left) !== returnedName) return undefined;
    return unwrapArray(assignment.right);
};

const isAliasAssignment = (statement: ts.Statement, returnedName: string, local: string): boolean =>
{
    if(local === returnedName || !ts.isExpressionStatement(statement) || !ts.isBinaryExpression(statement.expression)) return false;
    const assignment = statement.expression;
    return assignment.operatorToken.kind === ts.SyntaxKind.EqualsToken
        && ts.isPropertyAccessExpression(unwrap(assignment.left))
        && propertyName(assignment.left) === returnedName
        && ts.isIdentifier(unwrap(assignment.right))
        && (unwrap(assignment.right) as ts.Identifier).text === local;
};

const isPushOn = (node: ts.Node, arrayName: string): node is ts.CallExpression =>
    ts.isCallExpression(node) && ts.isPropertyAccessExpression(node.expression)
    && [ 'push', 'unshift', 'splice' ].includes(node.expression.name.text)
    && propertyName(node.expression.expression) === arrayName;

const pushStatement = (statement: ts.Statement, arrayName: string): ts.CallExpression | undefined =>
{
    if(!ts.isExpressionStatement(statement)) return undefined;
    const call = statement.expression;
    return isPushOn(call, arrayName) && (call.expression as ts.PropertyAccessExpression).name.text === 'push' ? call : undefined;
};

/** `xs.length` as an int count, `new Short(xs.length)` as a short one. */
const countOf = (raw: ts.Expression): { collection: string; type: ScalarType } | undefined =>
{
    let value = unwrap(raw);
    let type: ScalarType = 'int';
    if(ts.isNewExpression(value) && value.expression.getText() === 'Short' && value.arguments?.length === 1)
    {
        value = unwrap(value.arguments[0]);
        type = 'short';
    }
    if(!ts.isPropertyAccessExpression(value) || value.name.text !== 'length' || !ts.isIdentifier(value.expression)) return undefined;
    return { collection: value.expression.text, type };
};

/** The item of a loop over `collection` whose body only pushes to the array: `for...of` or `forEach`. */
const listItem = (
    statement: ts.Statement,
    collection: string,
    arrayName: string,
    parameters: ReadonlyMap<string, ts.ParameterDeclaration>,
    source: ts.SourceFile): WireSchema[] | string =>
{
    let variable: string | undefined;
    let body: ts.Node | undefined;
    if(ts.isForOfStatement(statement) && statement.expression.getText() === collection
        && ts.isVariableDeclarationList(statement.initializer) && statement.initializer.declarations.length === 1
        && ts.isIdentifier(statement.initializer.declarations[0].name))
    {
        variable = statement.initializer.declarations[0].name.text;
        body = statement.statement;
    }
    else if(ts.isExpressionStatement(statement) && ts.isCallExpression(statement.expression)
        && ts.isPropertyAccessExpression(statement.expression.expression)
        && statement.expression.expression.name.text === 'forEach'
        && statement.expression.expression.expression.getText() === collection
        && statement.expression.arguments.length === 1 && ts.isArrowFunction(statement.expression.arguments[0]))
    {
        const callback = statement.expression.arguments[0];
        if(callback.parameters.length === 1 && ts.isIdentifier(callback.parameters[0].name))
        {
            variable = callback.parameters[0].name.text;
            body = callback.body;
        }
    }
    if(!variable || !body) return `Outgoing count ${ collection }.length is not followed by a loop over it`;

    const pushes: ts.CallExpression[] = [];
    const bodyStatements = ts.isBlock(body) ? [ ...body.statements ] : [ body ];
    for(const node of bodyStatements)
    {
        const call = ts.isExpressionStatement(node) ? node.expression : node;
        if(!isPushOn(call, arrayName) || (call.expression as ts.PropertyAccessExpression).name.text !== 'push')
            return `Outgoing loop over ${ collection } does more than push`;
        pushes.push(call);
    }

    const element = elementType(collection, parameters);
    if(!element) return `Outgoing list ${ collection } has no statically resolvable item type`;
    if(!pushes.some(push => push.arguments.length)) return `Outgoing list over ${ collection } reads nothing statically`;
    const item: WireSchema[] = [];
    for(const value of pushes.flatMap(push => [ ...push.arguments ]))
    {
        const expression = unwrap(value);
        let type: ScalarType | undefined;
        let name = '';
        if(ts.isIdentifier(expression) && expression.text === variable) type = wireType(element);
        else if(ts.isPropertyAccessExpression(expression) && ts.isIdentifier(expression.expression)
            && expression.expression.text === variable)
        {
            name = expression.name.text;
            const member = memberType(element, name, source);
            type = member ? wireType(member) : undefined;
        }
        else
        {
            const field = outgoingField(value, parameters);
            if(typeof field === 'string') return field;
            item.push(field);
            continue;
        }
        if(!type) return `Outgoing list item ${ value.getText() } has no statically resolvable wire type`;
        item.push({ type, name });
    }
    return item;
};

/** The element type of a constructor parameter declared as `T[]` or `Array<T>` (rest parameters too). */
const elementType = (collection: string, parameters: ReadonlyMap<string, ts.ParameterDeclaration>): ts.TypeNode | undefined =>
{
    const type = parameters.get(collection)?.type;
    if(!type) return undefined;
    if(ts.isArrayTypeNode(type)) return type.elementType;
    if(ts.isTypeReferenceNode(type) && type.typeName.getText() === 'Array' && type.typeArguments?.length === 1)
        return type.typeArguments[0];
    return undefined;
};

/** A member's declared type, for an inline type literal or an interface, type alias or class of the same file. */
const memberType = (type: ts.TypeNode, member: string, source: ts.SourceFile): ts.TypeNode | undefined =>
{
    if(ts.isTypeLiteralNode(type)) return propertyType(type.members, member);
    if(!ts.isTypeReferenceNode(type)) return undefined;
    const name = type.typeName.getText();
    for(const statement of source.statements)
    {
        if(ts.isInterfaceDeclaration(statement) && statement.name.text === name) return propertyType(statement.members, member);
        if(ts.isTypeAliasDeclaration(statement) && statement.name.text === name) return memberType(statement.type, member, source);
        if(ts.isClassDeclaration(statement) && statement.name?.text === name)
        {
            for(const classMember of statement.members)
            {
                if(ts.isPropertyDeclaration(classMember) && classMember.name.getText() === member) return classMember.type;
                if(ts.isConstructorDeclaration(classMember))
                {
                    const parameter = classMember.parameters.find(candidate => candidate.name.getText() === member
                        && ts.getModifiers(candidate)?.length);
                    if(parameter) return parameter.type;
                }
            }
        }
    }
    return undefined;
};

const propertyType = (members: ts.NodeArray<ts.TypeElement>, member: string): ts.TypeNode | undefined =>
{
    const property = members.find(candidate => ts.isPropertySignature(candidate) && candidate.name.getText() === member);
    return property && ts.isPropertySignature(property) ? property.type : undefined;
};

/** Recognize one optional scalar at the end, without accepting arbitrary packet mutation. */
const trailingOptionalPush = (constructor: ts.ConstructorDeclaration, returnedName: string): ts.CallExpression | undefined =>
{
    const statement = constructor.body?.statements.at(-1);
    if(!statement || !ts.isIfStatement(statement) || statement.elseStatement) return undefined;
    const condition = unwrap(statement.expression);
    if(!ts.isBinaryExpression(condition) || condition.operatorToken.kind !== ts.SyntaxKind.ExclamationEqualsEqualsToken
        || !ts.isIdentifier(condition.left) || condition.right.getText() !== 'undefined') return undefined;
    const parameter = constructor.parameters.find(parameter => parameter.name.getText() === condition.left.getText());
    if(!parameter?.questionToken) return undefined;
    const body = ts.isBlock(statement.thenStatement) ? statement.thenStatement.statements : [statement.thenStatement];
    if(body.length !== 1 || !ts.isExpressionStatement(body[0])) return undefined;
    const call = body[0].expression;
    if(!ts.isCallExpression(call) || !ts.isPropertyAccessExpression(call.expression)
        || call.expression.name.text !== 'push' || propertyName(call.expression.expression) !== returnedName
        || call.arguments.length !== 1 || call.arguments[0].getText() !== condition.left.getText()) return undefined;
    return call;
};

const outgoingField = (
    raw: ts.Expression,
    parameters: ReadonlyMap<string, ts.ParameterDeclaration>): ScalarSchema | string =>
{
    const expression = unwrap(raw);
    if(ts.isNewExpression(expression))
    {
        const name = expression.expression.getText();
        if(name === 'Short') return { type: 'short', name: '' };
        if(name === 'Byte') return { type: 'byte', name: '' };
        if(name === 'ArrayBuffer') return { type: 'bytes', name: '' };
    }
    if(ts.isNumericLiteral(expression)) return { type: 'int', name: '' };
    if(ts.isStringLiteral(expression) || ts.isNoSubstitutionTemplateLiteral(expression)) return { type: 'string', name: '' };
    if(expression.kind === ts.SyntaxKind.TrueKeyword || expression.kind === ts.SyntaxKind.FalseKeyword)
        return { type: 'boolean', name: '' };
    const name = propertyName(expression) ?? (ts.isIdentifier(expression) ? expression.text : undefined);
    if(name)
    {
        const parameter = parameters.get(name);
        if(parameter?.type)
        {
            const type = wireType(parameter.type);
            if(type) return { type, name };
        }
    }
    return `Outgoing value ${ expression.getText() } has no statically resolvable wire type`;
};

const wireType = (type: ts.TypeNode): ScalarType | undefined =>
{
    if(type.kind === ts.SyntaxKind.NumberKeyword) return 'int';
    if(type.kind === ts.SyntaxKind.StringKeyword) return 'string';
    if(type.kind === ts.SyntaxKind.BooleanKeyword) return 'boolean';
    const text = type.getText();
    if(text === 'Short') return 'short';
    if(text === 'Byte') return 'byte';
    if(text === 'ArrayBuffer') return 'bytes';
    return undefined;
};

const readCall = (call: ts.CallExpression): ScalarType | undefined =>
{
    if(!ts.isPropertyAccessExpression(call.expression)) return undefined;
    return READ_TYPES[call.expression.name.text];
};

const localHelperName = (call: ts.CallExpression): string | undefined =>
{
    if(!ts.isPropertyAccessExpression(call.expression)
        || call.expression.expression.kind !== ts.SyntaxKind.ThisKeyword) return undefined;
    return call.expression.name.text;
};

const inferredName = (call: ts.CallExpression): string =>
{
    const parent = call.parent;
    if(ts.isVariableDeclaration(parent) && ts.isIdentifier(parent.name)) return parent.name.text;
    if(ts.isBinaryExpression(parent)) return propertyName(parent.left) ?? '';
    return '';
};

const dynamicPacketFlow = (
    method: ReaderFunction,
    methods: ReadonlyMap<string, ts.MethodDeclaration>,
    loops: ReadonlyMap<ts.CallExpression, ListLoop>): string | undefined =>
{
    const listLoops = new Set<ts.Node>([ ...loops.values() ].map(loop => loop.loop));
    let reason: string | undefined;
    visit(method.body, node =>
    {
        if(reason || listLoops.has(node) || !(ts.isIfStatement(node) || ts.isSwitchStatement(node) || ts.isForStatement(node)
            || ts.isForOfStatement(node) || ts.isForInStatement(node) || ts.isWhileStatement(node)
            || ts.isDoStatement(node))) return;
        if(readsPacket(node, methods, new Set()))
            reason = `Data-dependent packet operations in ${ ts.SyntaxKind[node.kind] } inside ${ functionName(method) }`;
    });
    return reason;
};

/** Whether a node reads packet fields, directly, through same-class helpers, or by handing the wrapper on. */
const readsPacket = (node: ts.Node, methods: ReadonlyMap<string, ts.MethodDeclaration>, visited: Set<string>): boolean =>
    containsNode(node, child =>
    {
        if(ts.isNewExpression(child)) return receivesWrapper(child, wrapperNames(child));
        if(!ts.isCallExpression(child)) return false;
        if(readCall(child)) return true;
        if(!localHelperName(child) && receivesWrapper(child, wrapperNames(child))) return true;
        const helperName = localHelperName(child);
        if(!helperName || !methods.has(helperName) || visited.has(helperName)) return false;
        visited.add(helperName);
        return readsPacket(methods.get(helperName), methods, visited);
    });

const unwrapArray = (expression: ts.Expression): ts.ArrayLiteralExpression | undefined =>
{
    const value = unwrap(expression);
    return ts.isArrayLiteralExpression(value) ? value : undefined;
};

const unwrap = (expression: ts.Expression): ts.Expression =>
{
    if(ts.isAsExpression(expression) || ts.isTypeAssertionExpression(expression)
        || ts.isParenthesizedExpression(expression)) return unwrap(expression.expression);
    return expression;
};

const propertyName = (expression: ts.Expression): string | undefined =>
{
    const value = unwrap(expression);
    if(ts.isPropertyAccessExpression(value) && value.expression.kind === ts.SyntaxKind.ThisKeyword)
        return value.name.text;
    if(ts.isIdentifier(value)) return value.text;
    return undefined;
};

const visit = (node: ts.Node | undefined, action: (node: ts.Node) => void): void =>
{
    if(!node) return;
    action(node);
    node.forEachChild(child => visit(child, action));
};

const unsupported = (unsupportedReason: string): TypeScriptExtractionResult => ({ fields: [], unsupportedReason });
