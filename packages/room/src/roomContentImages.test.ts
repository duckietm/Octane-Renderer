import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

describe('RoomContentLoader images', () =>
{
    const source = readFileSync(join(__dirname, 'RoomContentLoader.ts'), 'utf8');
    const download = source.slice(source.indexOf('public downloadImage('), source.indexOf('public downloadAssetSync('));

    it('joins a download already on its way instead of starting another', () =>
    {
        expect(download.indexOf('waiting.push(id);')).toBeLessThan(download.indexOf('new Image()'));
        expect(download).toContain('for(const waitingId of ids) this._iconListener.onRoomContentLoaded(waitingId, key, loaded);');
    });

    it('keeps at most MAX_CACHED_IMAGES images', () =>
    {
        expect(download).toContain('while(this._images.size > RoomContentLoader.MAX_CACHED_IMAGES)');
    });
});
