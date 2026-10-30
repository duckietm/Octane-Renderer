import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('BadgeImageManager badge downloads', () =>
{
    const source = readFileSync(join(__dirname, 'BadgeImageManager.ts'), 'utf8');

    it('starts one download per badge while it is on its way', () =>
    {
        const check = source.indexOf('if(this._loadingBadgeUrls.has(url)) return this.getBadgePlaceholder();');
        const add = source.indexOf('this._loadingBadgeUrls.add(url);');
        const load = source.indexOf('void loadBadge();');

        expect(check).toBeGreaterThan(-1);
        expect(add).toBeGreaterThan(check);
        expect(load).toBeGreaterThan(add);
    });

    it('forgets the download once it ended, whatever the outcome', () =>
    {
        expect(source).toMatch(/finally\s*\{\s*this\._loadingBadgeUrls\.delete\(url\);/);
    });
});
