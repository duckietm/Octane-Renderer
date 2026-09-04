import { describe, expect, it } from 'vitest';
import {
    ConfigJsonError,
    fetchConfigJson,
    parseConfigJson,
    parseConfigJsonFromResponse,
    parseConfigJsonWithMode
} from '../JsonParser';

describe('parseConfigJson', () =>
{
    it('parses strict JSON', () =>
    {
        const result = parseConfigJson('{"a": 1, "b": [2, 3]}');
        expect(result).toEqual({ a: 1, b: [ 2, 3 ] });
    });

    it('parses comments and trailing commas in auto mode', () =>
    {
        const result = parseConfigJsonWithMode<{ value: number }>('{ // comment\n "value": 1, }', 'auto', 'config.json');
        expect(result).toEqual({ value: 1 });
    });

    it('parses an explicit jsonc URL even in legacy mode', () =>
    {
        const result = parseConfigJsonWithMode<{ value: number }>('{ "value": 1, }', 'legacy', 'config.jsonc');
        expect(result).toEqual({ value: 1 });
    });

    it('rejects comments and trailing commas in legacy mode for json URLs', () =>
    {
        expect(() => parseConfigJsonWithMode('{ "value": 1, }', 'legacy', 'config.json'))
            .toThrow(ConfigJsonError);
    });

    it.each([
        '{ \'value\': 1 }',
        '{ value: 1 }',
        '{ "value": 0x10 }',
        '{ "value": Infinity }'
    ])('rejects JSON5-only syntax: %s', source =>
    {
        expect(() => parseConfigJsonWithMode(source, 'jsonc', 'config.jsonc'))
            .toThrow(ConfigJsonError);
    });

    it('does not treat a json5 URL as JSONC', () =>
    {
        expect(() => parseConfigJsonWithMode('{ "value": 1, }', 'auto', 'config.json5'))
            .toThrow(ConfigJsonError);
    });

    it('throws a helpful error when strict JSON and JSONC fail', () =>
    {
        expect(() => parseConfigJsonWithMode('{ this is :: not json ::', 'auto', 'cfg.json'))
            .toThrowError(/Failed to parse JSON\/JSONC in "cfg\.json"/);
    });
});

describe('parseConfigJsonFromResponse', () =>
{
    const buildResponse = (body: string, contentType = 'application/json', url = 'https://example.com/x.json'): Response =>
    {
        const headers = new Headers({ 'content-type': contentType });
        return new Response(body, { status: 200, headers });
    };

    it('parses JSON response bodies', async () =>
    {
        const res = buildResponse('{"a": 1}');
        await expect(parseConfigJsonFromResponse(res, 'https://example.com/x.json')).resolves.toEqual({ a: 1 });
    });

    it('parses JSONC response bodies with comments', async () =>
    {
        const res = buildResponse('{ /* comment */ "a": 1, "b": 2, }');
        await expect(parseConfigJsonFromResponse(res, 'https://example.com/x.json')).resolves.toEqual({ a: 1, b: 2 });
    });

    it('respects application/jsonc content-type', async () =>
    {
        const res = buildResponse('{ "a": 1, }', 'application/jsonc');
        await expect(parseConfigJsonFromResponse(res, 'https://example.com/x.txt')).resolves.toEqual({ a: 1 });
    });
});

describe('fetchConfigJson', () =>
{
    it('fetches and parses JSON or JSONC', async () =>
    {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async () => new Response('{ "a": 1, "b": 2, }', {
            status: 200,
            headers: { 'content-type': 'application/json' }
        }));

        try
        {
            await expect(fetchConfigJson('https://example.com/cfg.json')).resolves.toEqual({ a: 1, b: 2 });
        }
        finally
        {
            globalThis.fetch = originalFetch;
        }
    });

    it('throws for non-200 responses', async () =>
    {
        const originalFetch = globalThis.fetch;
        globalThis.fetch = (async () => new Response('', { status: 404 }));

        try
        {
            await expect(fetchConfigJson('https://example.com/missing.json')).rejects.toThrowError(/HTTP 404/);
        }
        finally
        {
            globalThis.fetch = originalFetch;
        }
    });
});
