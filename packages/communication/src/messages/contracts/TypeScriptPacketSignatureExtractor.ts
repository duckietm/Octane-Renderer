import { readFileSync } from 'node:fs';
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

export const extractTypeScriptPacketSignature = (
    path: string,
    side: TypeScriptPacketSide): TypeScriptExtractionResult =>
{
    const source = ts.createSourceFile(path, readFileSync(path, 'utf8'), ts.ScriptTarget.Latest, true);
    const packetClass = source.statements.find(ts.isClassDeclaration);
    if(!packetClass) return unsupported(`No packet class found in ${ path }`);
    return side === 'incoming' ? extractIncoming(packetClass) : extractOutgoing(packetClass);
};

const extractIncoming = (packetClass: ts.ClassDeclaration): TypeScriptExtractionResult =>
{
    const methods = new Map<string, ts.MethodDeclaration>();
    const overloaded = new Set<string>();
    for(const member of packetClass.members)
    {
        if(!ts.isMethodDeclaration(member) || !member.body) continue;
        const name = member.name.getText();
        if(methods.has(name)) overloaded.add(name);
        methods.set(name, member);
    }
    const root = methods.get('parse');
    if(!root) return unsupported('Incoming parser has no parse method');
    return extractIncomingMethod(root, methods, overloaded, []);
};

const extractIncomingMethod = (
    method: ts.MethodDeclaration,
    methods: ReadonlyMap<string, ts.MethodDeclaration>,
    overloaded: ReadonlySet<string>,
    stack: readonly string[]): TypeScriptExtractionResult =>
{
    const name = method.name.getText();
    if(stack.includes(name)) return unsupported(`Recursive packet helper ${ [...stack, name].join(' -> ') }`);
    const dynamic = dynamicPacketFlow(method);
    if(dynamic) return unsupported(dynamic);

    const calls: ts.CallExpression[] = [];
    visit(method.body, node =>
    {
        if(ts.isCallExpression(node)) calls.push(node);
    });
    calls.sort((left, right) => left.getStart() - right.getStart());
    const fields: WireSchema[] = [];
    const optionalGuard = trailingOptionalGuard(method);
    const optionalFields: WireSchema[] = [];
    for(const call of calls)
    {
        const destination = optionalGuard && call.getStart() > optionalGuard.position
            ? optionalFields
            : fields;
        const read = readCall(call);
        if(read)
        {
            destination.push({ type: read, name: inferredName(call) });
            continue;
        }
        const helperName = localHelperName(call);
        if(!helperName) continue;
        if(!methods.has(helperName))
        {
            if(/^(read|parse)/i.test(helperName)) return unsupported(`Unresolved packet helper ${ helperName }`);
            continue;
        }
        if(overloaded.has(helperName)) return unsupported(`Overloaded packet helper ${ helperName } cannot be resolved safely`);
        const helper = extractIncomingMethod(methods.get(helperName), methods, overloaded, [...stack, name]);
        if(helper.unsupportedReason) return helper;
        destination.push(...helper.fields);
    }
    if(optionalGuard && optionalFields.length)
        fields.push({ type: 'optional', controller: optionalGuard.controller, fields: optionalFields });
    const wrapperNames = new Set(method.parameters.map(parameter => parameter.name.getText()));
    let delegatedConstructor: string | undefined;
    visit(method.body, node =>
    {
        if(delegatedConstructor || !ts.isNewExpression(node)) return;
        if(node.arguments?.some(argument => ts.isIdentifier(unwrap(argument))
            && wrapperNames.has((unwrap(argument) as ts.Identifier).text)))
            delegatedConstructor = node.expression.getText();
    });
    if(delegatedConstructor)
        return unsupported(`Packet fields delegated to external constructor ${ delegatedConstructor } inside ${ name }`);
    return { fields };
};

const trailingOptionalGuard = (
    method: ts.MethodDeclaration): { controller: string; position: number } | undefined =>
{
    for(const statement of method.body?.statements ?? [])
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
    if(returnedName)
    {
        let mutator: string | undefined;
        visit(packetClass, node =>
        {
            if(mutator || !ts.isCallExpression(node) || !ts.isPropertyAccessExpression(node.expression)) return;
            const methodName = node.expression.name.text;
            if(!['push', 'unshift', 'splice'].includes(methodName)) return;
            if(propertyName(node.expression.expression) === returnedName) mutator = methodName;
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
    return { fields };
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

const dynamicPacketFlow = (method: ts.MethodDeclaration): string | undefined =>
{
    let reason: string | undefined;
    visit(method.body, node =>
    {
        if(reason || !(ts.isIfStatement(node) || ts.isSwitchStatement(node) || ts.isForStatement(node)
            || ts.isForOfStatement(node) || ts.isForInStatement(node) || ts.isWhileStatement(node)
            || ts.isDoStatement(node))) return;
        let containsRead = false;
        visit(node, child =>
        {
            if(ts.isCallExpression(child) && readCall(child)) containsRead = true;
        });
        if(containsRead) reason = `Data-dependent packet operations in ${ ts.SyntaxKind[node.kind] } inside ${ method.name.getText() }`;
    });
    return reason;
};

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
