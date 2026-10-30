import { describe, expect, it } from 'vitest';
import { fillUrlTemplate } from './ExternalUrls';

describe('fillUrlTemplate', () =>
{
    it('puts an ordinary badge code in as it is', () =>
    {
        expect(fillUrlTemplate('https://cdn.test/badges/%badgename%.gif', '%badgename%', 'ACH_Login1')).toBe('https://cdn.test/badges/ACH_Login1.gif');
    });

    it('encodes characters that would change the path or the query', () =>
    {
        expect(fillUrlTemplate('/badges/%badgename%.gif', '%badgename%', '../x?y#z')).toBe('/badges/..%2Fx%3Fy%23z.gif');
    });

    it('does not read replacement patterns in the value', () =>
    {
        expect(fillUrlTemplate('/b/%badgename%', '%badgename%', '$&')).toBe('/b/%24%26');
    });
});
