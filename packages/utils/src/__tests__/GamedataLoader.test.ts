import { afterEach, describe, expect, it } from 'vitest';
import { loadGamedataWithMode } from '../GamedataLoader';

const originalFetch = globalThis.fetch;

afterEach(() =>
{
    globalThis.fetch = originalFetch;
});

describe('loadGamedataWithMode', () =>
{
    it('loads jsonc manifests and fragments in jsonc mode', async () =>
    {
        const requested: string[] = [];

        globalThis.fetch = (async (input: RequestInfo | URL) =>
        {
            const url = String(input);
            requested.push(url);

            if(url.endsWith('/manifest.jsonc'))
            {
                return new Response('{ "files": [ "data.jsonc" ], }', { status: 200 });
            }

            if(url.endsWith('/data.jsonc'))
            {
                return new Response('{ "items": [ { "id": 1 } ], }', { status: 200 });
            }

            return new Response('', { status: 404 });
        });

        await expect(loadGamedataWithMode('https://hotel.test/gamedata/', 'jsonc', { tiers: [] }))
            .resolves.toEqual({ items: [ { id: 1 } ] });

        expect(requested).toEqual([
            'https://hotel.test/gamedata/manifest.jsonc',
            'https://hotel.test/gamedata/data.jsonc'
        ]);
    });

    it('falls back from a missing jsonc manifest to json in auto mode', async () =>
    {
        const requested: string[] = [];

        globalThis.fetch = (async (input: RequestInfo | URL) =>
        {
            const url = String(input);
            requested.push(url);

            if(url.endsWith('/manifest.jsonc')) return new Response('', { status: 404 });
            if(url.endsWith('/manifest.json')) return new Response('{ "files": [ "data.json" ] }', { status: 200 });
            if(url.endsWith('/data.json')) return new Response('{ "value": 2 }', { status: 200 });

            return new Response('', { status: 404 });
        });

        await expect(loadGamedataWithMode('https://hotel.test/gamedata/', 'auto', { tiers: [] }))
            .resolves.toEqual({ value: 2 });

        expect(requested).toEqual([
            'https://hotel.test/gamedata/manifest.jsonc',
            'https://hotel.test/gamedata/manifest.json',
            'https://hotel.test/gamedata/data.json'
        ]);
    });

    it('requests only json manifests in legacy mode', async () =>
    {
        const requested: string[] = [];

        globalThis.fetch = (async (input: RequestInfo | URL) =>
        {
            const url = String(input);
            requested.push(url);

            if(url.endsWith('/manifest.json')) return new Response('{ "files": [ "data.json" ] }', { status: 200 });
            if(url.endsWith('/data.json')) return new Response('{ "value": 3 }', { status: 200 });

            return new Response('', { status: 404 });
        });

        await expect(loadGamedataWithMode('https://hotel.test/gamedata/', 'legacy', { tiers: [] }))
            .resolves.toEqual({ value: 3 });

        expect(requested).toEqual([
            'https://hotel.test/gamedata/manifest.json',
            'https://hotel.test/gamedata/data.json'
        ]);
    });
});
