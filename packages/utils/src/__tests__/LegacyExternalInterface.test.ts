import { afterEach, describe, expect, it, vi } from 'vitest';
import { LegacyExternalInterface } from '../LegacyExternalInterface';

const withAncestorOrigins = (origins: string[] | undefined) =>
{
    vi.spyOn(window, 'location', 'get').mockReturnValue({ ...window.location, ancestorOrigins: origins as unknown as DOMStringList });
};

describe('LegacyExternalInterface.getParentOrigin', () =>
{
    afterEach(() =>
    {
        vi.restoreAllMocks();
        LegacyExternalInterface.setParentOrigin(null);
    });

    it('targets the top origin the browser reports', () =>
    {
        withAncestorOrigins([ 'https://cms.example', 'https://hotel.example' ]);

        expect(LegacyExternalInterface.getParentOrigin()).toBe('https://hotel.example');
    });

    it('sends nowhere for the opaque "null" origin reported without a referrer', () =>
    {
        withAncestorOrigins([ 'null' ]);

        expect(LegacyExternalInterface.getParentOrigin()).toBeNull();
    });

    it('sends nowhere when the browser reports no ancestor origins and none is configured', () =>
    {
        withAncestorOrigins(undefined);

        expect(LegacyExternalInterface.getParentOrigin()).toBeNull();
    });

    it('prefers the configured parent origin over what the browser reports', () =>
    {
        withAncestorOrigins([ 'https://framing-site.example' ]);
        LegacyExternalInterface.setParentOrigin('https://hotel.example/client/');

        expect(LegacyExternalInterface.getParentOrigin()).toBe('https://hotel.example');
    });

    it('ignores a configured value that is not an origin', () =>
    {
        withAncestorOrigins(undefined);
        LegacyExternalInterface.setParentOrigin('not a url');

        expect(LegacyExternalInterface.getParentOrigin()).toBeNull();
    });
});

describe('LegacyExternalInterface.call', () =>
{
    afterEach(() =>
    {
        vi.restoreAllMocks();
        LegacyExternalInterface.setParentOrigin(null);
    });

    it('never posts to the top window with a "*" target', () =>
    {
        const postMessage = vi.fn();

        vi.spyOn(window, 'top', 'get').mockReturnValue({ postMessage } as unknown as Window);
        withAncestorOrigins(undefined);

        (LegacyExternalInterface.call as (method: string) => void)('heartBeat');
        expect(postMessage).not.toHaveBeenCalled();

        LegacyExternalInterface.setParentOrigin('https://hotel.example');
        (LegacyExternalInterface.call as (method: string) => void)('heartBeat');
        expect(postMessage).toHaveBeenCalledWith(expect.any(String), 'https://hotel.example');
    });
});
