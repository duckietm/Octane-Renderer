import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegacyExternalInterface } from '@octane/utils';
import { ConfigurationManager } from './ConfigurationManager';

const jsonResponse = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'content-type': 'application/json' } });

const deferred = <T>() =>
{
    let resolve: (value: T) => void = null;
    const promise = new Promise<T>(r => (resolve = r));

    return { promise, resolve };
};

describe('ConfigurationManager.reloadConfiguration', () =>
{
    afterEach(() =>
    {
        vi.unstubAllGlobals();
        delete (window as any).OctaneConfig;
    });

    it('keeps the previous values until the new files are fetched and parsed', async () =>
    {
        (window as any).OctaneConfig = { 'config.urls': [ '/renderer-config.json' ] };

        const first = jsonResponse({ 'api.url': 'http://127.0.0.1:2096', 'login.endpoint': '${api.url}/api/auth/login' });
        const second = deferred<Response>();
        const fetchMock = vi.fn().mockReturnValueOnce(Promise.resolve(first)).mockReturnValueOnce(second.promise);

        vi.stubGlobal('fetch', fetchMock);

        const manager = new ConfigurationManager();

        await manager.init();

        expect(manager.getValue('login.endpoint', 'MISSING')).toBe('http://127.0.0.1:2096/api/auth/login');

        const reload = manager.reloadConfiguration();

        // Mid-reload: the old value must still be readable.
        expect(manager.getValue('login.endpoint', 'MISSING')).toBe('http://127.0.0.1:2096/api/auth/login');

        second.resolve(jsonResponse({ 'api.url': 'http://10.0.0.1:2096', 'login.endpoint': '${api.url}/api/auth/login' }));

        await reload;

        expect(manager.getValue('login.endpoint', 'MISSING')).toBe('http://10.0.0.1:2096/api/auth/login');
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });

    it('keeps the previous values when a reload fails', async () =>
    {
        (window as any).OctaneConfig = { 'config.urls': [ '/renderer-config.json' ] };

        const fetchMock = vi.fn()
            .mockReturnValueOnce(Promise.resolve(jsonResponse({ 'login.endpoint': 'http://127.0.0.1:2096/api/auth/login' })))
            .mockReturnValueOnce(Promise.resolve(jsonResponse({}, 500)));

        vi.stubGlobal('fetch', fetchMock);

        const manager = new ConfigurationManager();

        await manager.init();
        await expect(manager.reloadConfiguration()).rejects.toThrow(/HTTP 500/);

        expect(manager.getValue('login.endpoint', 'MISSING')).toBe('http://127.0.0.1:2096/api/auth/login');
    });
});

describe('ConfigurationManager.init', () =>
{
    afterEach(() =>
    {
        vi.unstubAllGlobals();
        delete (window as any).OctaneConfig;
    });

    it('says that config.urls is missing instead of failing on it', async () =>
    {
        (window as any).OctaneConfig = { 'some.key': 1 };
        vi.stubGlobal('fetch', vi.fn());

        await expect(new ConfigurationManager().init()).rejects.toThrow('No config.urls defined');
    });

    it('loads the configuration once; later calls share that load', async () =>
    {
        (window as any).OctaneConfig = { 'config.urls': [ '/a.json' ] };

        const fetchMock = vi.fn(() => Promise.resolve(jsonResponse({ 'x': 1 })));
        vi.stubGlobal('fetch', fetchMock);

        const manager = new ConfigurationManager();

        await Promise.all([ manager.init(), manager.init() ]);
        await manager.init();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(manager.getValue<number>('x')).toBe(1);
    });

    it('fetches the documents together and still applies them in config.urls order', async () =>
    {
        (window as any).OctaneConfig = { 'config.urls': [ '/a.json', '/b.json' ] };

        const a = deferred<Response>();
        const b = deferred<Response>();
        const fetchMock = vi.fn((url: string) => (url === '/a.json' ? a.promise : b.promise));
        vi.stubGlobal('fetch', fetchMock);

        const manager = new ConfigurationManager();
        const loading = manager.init();

        // Both requests are out before either answers.
        await vi.waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));

        // The second file answers first; the result must not depend on that.
        b.resolve(jsonResponse({ 'key': 'second', 'only.b': true }));
        a.resolve(jsonResponse({ 'key': 'first', 'only.a': true }));
        await loading;

        // Same as the sequential load: the documents apply in config.urls order.
        expect(manager.getValue<string>('key')).toBe('first');
        expect(manager.getValue<boolean>('only.a')).toBe(true);
        expect(manager.getValue<boolean>('only.b')).toBe(true);
    });

    it('retries a failed initial load on the next call', async () =>
    {
        (window as any).OctaneConfig = { 'config.urls': [ '/a.json' ] };

        const fetchMock = vi.fn()
            .mockReturnValueOnce(Promise.resolve(jsonResponse({}, 500)))
            .mockReturnValueOnce(Promise.resolve(jsonResponse({ 'x': 2 })));
        vi.stubGlobal('fetch', fetchMock);

        const manager = new ConfigurationManager();

        await expect(manager.init()).rejects.toThrow();
        await manager.init();

        expect(manager.getValue<number>('x')).toBe(2);
    });
});

describe('ConfigurationManager.parseConfiguration', () =>
{
    it('keeps a key whose parent is also a key with a plain value, and every key after it', () =>
    {
        const manager = new ConfigurationManager();

        expect(manager.parseConfiguration({ 'loader': 'Opstarten...', 'loader.waiting': 'Loading content...', 'toolbar.stories.enabled': false })).toBe(true);

        expect(manager.getValue('loader')).toBe('Opstarten...');
        expect(manager.getValue('loader.waiting')).toBe('Loading content...');
        expect(manager.getValue('toolbar.stories.enabled')).toBe(false);
    });

    it('tells the external interface which page may embed the client', async () =>
    {
        (window as any).OctaneConfig = { 'config.urls': [ '/ui-config.json' ] };
        vi.stubGlobal('fetch', vi.fn().mockReturnValue(Promise.resolve(jsonResponse({ 'legacy.parent.origin': 'https://hotel.example' }))));
        vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, ancestorOrigins: undefined });

        await new ConfigurationManager().init();

        expect(LegacyExternalInterface.getParentOrigin()).toBe('https://hotel.example');

        LegacyExternalInterface.setParentOrigin(null);
        vi.restoreAllMocks();
    });
});

describe('ConfigurationManager.setValue', () =>
{
    it('refuses a key that would reach Object.prototype', () =>
    {
        const manager = new ConfigurationManager();

        manager.setValue('__proto__.polluted', 'yes');
        manager.setValue('constructor.prototype.polluted', 'yes');

        expect(({} as Record<string, unknown>).polluted).toBeUndefined();
        expect(manager.getValue('__proto__.polluted', null)).toBeNull();
    });

    it('still sets a nested key', () =>
    {
        const manager = new ConfigurationManager();

        manager.setValue('loader.waiting', 'yes');

        expect(manager.getValue('loader.waiting')).toBe('yes');
    });
});
