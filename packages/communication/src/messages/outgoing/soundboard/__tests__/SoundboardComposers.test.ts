import { describe, expect, it } from 'vitest';
import { SoundboardCatalogReorderComposer } from '../SoundboardCatalogReorderComposer';
import { SoundboardCatalogRequestComposer } from '../SoundboardCatalogRequestComposer';
import { SoundboardCatalogUpsertComposer } from '../SoundboardCatalogUpsertComposer';
import { SoundboardRequestSettingsComposer } from '../SoundboardRequestSettingsComposer';
import { SoundboardSaveVolumeComposer } from '../SoundboardSaveVolumeComposer';

describe('Soundboard management composers', () =>
{
    it('creates empty request packets', () =>
    {
        expect(new SoundboardRequestSettingsComposer().getMessageArray()).toEqual([]);
        expect(new SoundboardCatalogRequestComposer().getMessageArray()).toEqual([]);
    });

    it('clamps the saved personal volume', () =>
    {
        expect(new SoundboardSaveVolumeComposer(140).getMessageArray()).toEqual([ 100 ]);
        expect(new SoundboardSaveVolumeComposer(-10).getMessageArray()).toEqual([ 0 ]);
    });

    it('keeps the authoritative upsert wire order', () =>
    {
        expect(new SoundboardCatalogUpsertComposer(7, 'Campanella', '/sounds/bell.mp3', 5, false, 'bell', 20).getMessageArray()).toEqual([
            7,
            'Campanella',
            '/sounds/bell.mp3',
            5,
            false,
            'bell',
            20
        ]);
    });

    it('appends an empty classname and keeps the cooldown when none is given', () =>
    {
        expect(new SoundboardCatalogUpsertComposer(7, 'Campanella', '/sounds/bell.mp3', 5, false).getMessageArray()).toEqual([
            7,
            'Campanella',
            '/sounds/bell.mp3',
            5,
            false,
            '',
            -1
        ]);
    });

    it('prefixes a reorder with its item count', () =>
    {
        expect(new SoundboardCatalogReorderComposer([ 7, 3 ]).getMessageArray()).toEqual([ 2, 7, 3 ]);
    });
});
