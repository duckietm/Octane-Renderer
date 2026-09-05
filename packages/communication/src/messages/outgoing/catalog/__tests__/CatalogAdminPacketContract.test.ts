import { describe, expect, it } from 'vitest';
import { OctaneMessages } from '../../../../OctaneMessages';
import { OutgoingHeader } from '../../OutgoingHeader';
import { CatalogAdminSavePageIconComposer } from '../CatalogAdminSavePageIconComposer';
import { CatalogAdminSavePageImagesComposer } from '../CatalogAdminSavePageImagesComposer';
import * as CatalogAdminComposers from '..';

describe('catalog admin packet contract', () =>
{
    it('matches the emulator page asset update headers', () =>
    {
        expect(OutgoingHeader.CATALOG_ADMIN_SAVE_PAGE_IMAGES).toBe(10060);
        expect(OutgoingHeader.CATALOG_ADMIN_SAVE_PAGE_ICON).toBe(10061);
    });

    it('registers both page asset composers', () =>
    {
        const messages = new OctaneMessages();

        expect(messages.composers.get(10060)).toBe(CatalogAdminSavePageImagesComposer);
        expect(messages.composers.get(10061)).toBe(CatalogAdminSavePageIconComposer);
    });

    it('uses dedicated page state packets so root parent id remains available for moves', () =>
    {
        const SetEnabled = (CatalogAdminComposers as any).CatalogAdminSetPageEnabledComposer;
        const SetVisible = (CatalogAdminComposers as any).CatalogAdminSetPageVisibleComposer;

        expect((OutgoingHeader as any).CATALOG_ADMIN_SET_PAGE_ENABLED).toBe(10064);
        expect((OutgoingHeader as any).CATALOG_ADMIN_SET_PAGE_VISIBLE).toBe(10065);
        expect(new SetEnabled(42, false, 'NORMAL').getMessageArray()).toEqual([ 42, false, 'NORMAL', 0, 0, '', '', '' ]);
        expect(new SetVisible(42, true, 'NORMAL').getMessageArray()).toEqual([ 42, true, 'NORMAL', 0, 0, '', '', '' ]);
    });

    it('sends offer ordering as one atomic batch', () =>
    {
        const ReorderOffers = (CatalogAdminComposers as any).CatalogAdminReorderOffersComposer;

        expect((OutgoingHeader as any).CATALOG_ADMIN_REORDER_OFFERS).toBe(10066);
        expect(new ReorderOffers([ { id: 10, orderNumber: 0 }, { id: 11, orderNumber: 1 } ], 'NORMAL').getMessageArray())
            .toEqual([ 2, 10, 0, 11, 1, 'NORMAL', 0, 0, '', '', '' ]);
    });

    it('sends every editable page field when saving', () =>
    {
        const SavePage = (CatalogAdminComposers as any).CatalogAdminSavePageComposer;
        const message = new SavePage(
            42, 'Guild shop', 'guild_shop', 'guild_furni', 145, 5, true, false, 9, 7,
            'headline', 'teaser', 'details', 'NORMAL', 'BOTH', 'text one',
            3, true, false, 'special', 'text two', 'teaser text', 123, '1;2;3',
            12, 7, 'token-123', 'Updated page: Guild shop', 'save-page-1'
        ).getMessageArray();

        expect(message).toEqual([
            42, 'Guild shop', 'guild_shop', 'guild_furni', 145, 5, true, false, 9, 7,
            'headline', 'teaser', 'details', 'NORMAL', 'BOTH', 'text one',
            3, true, false, 'special', 'text two', 'teaser text', 123, '1;2;3',
            12, 7, 'token-123', 'Updated page: Guild shop', 'save-page-1'
        ]);
    });

    it('appends the shared draft envelope to legacy edit packets', () =>
    {
        const SavePage = (CatalogAdminComposers as any).CatalogAdminSavePageComposer;
        const message = new SavePage(
            42, 'Guild shop', 'guild_shop', 'guild_furni', 145, 5, true, false, 9, 7,
            'headline', 'teaser', 'details', 'NORMAL', 'BOTH', 'text one',
            3, true, false, 'special', 'text two', 'teaser text', 123, '1;2;3',
            12, 7, 'token-123', 'Updated page: Guild shop', 'save-page-1'
        ).getMessageArray();

        expect(message.slice(-5)).toEqual([ 12, 7, 'token-123', 'Updated page: Guild shop', 'save-page-1' ]);
    });

    it('uses the live revision and operation id for inspector reads and asset mutations', () =>
    {
        const LoadPage = (CatalogAdminComposers as any).CatalogAdminLoadPageComposer;
        const LoadOffer = (CatalogAdminComposers as any).CatalogAdminLoadOfferComposer;
        const MoveOffer = (CatalogAdminComposers as any).CatalogAdminMoveOfferComposer;

        expect(new LoadPage(42, 'NORMAL', 12, 7).getMessageArray())
            .toEqual([ 42, 'NORMAL', 12, 7 ]);
        expect(new LoadOffer(99, 'NORMAL', 12, 7).getMessageArray())
            .toEqual([ 99, 'NORMAL', 12, 7 ]);
        expect(new MoveOffer(99, 3, 'NORMAL', 12, 7, '', 'Moved offer #99', 'move-offer-1').getMessageArray())
            .toEqual([ 99, 3, 'NORMAL', 12, 7, '', 'Moved offer #99', 'move-offer-1' ]);
        expect(new CatalogAdminSavePageIconComposer(42, 145, 'BUILDER', 12, 7, '', 'Updated page icon', 'icon-1').getMessageArray())
            .toEqual([ 42, 145, 'BUILDER', 12, 7, '', 'Updated page icon', 'icon-1' ]);
        expect(new CatalogAdminSavePageImagesComposer(42, 'head', 'teaser', 'NORMAL', 12, 7, '', 'Updated page images', 'images-1').getMessageArray())
            .toEqual([ 42, 'head', 'teaser', 'NORMAL', 12, 7, '', 'Updated page images', 'images-1' ]);
    });

    it('sends every editable page field when creating', () =>
    {
        const CreatePage = (CatalogAdminComposers as any).CatalogAdminCreatePageComposer;
        const message = new CreatePage(
            'Guild shop', 'guild_shop', 'guild_furni', 145, 5, true, false, 9, 7,
            'NORMAL', 'BOTH', 3, true, false, 'headline', 'teaser', 'special',
            'text one', 'text two', 'details', 'teaser text', 123, '1;2;3'
        ).getMessageArray();

        expect(message).toEqual([
            'Guild shop', 'guild_shop', 'guild_furni', 145, 5, true, false, 9, 7,
            'NORMAL', 'BOTH', 3, true, false, 'headline', 'teaser', 'special',
            'text one', 'text two', 'details', 'teaser text', 123, '1;2;3',
            0, 0, '', '', ''
        ]);
    });

    it('sends every editable offer field including the song id', () =>
    {
        const SaveOffer = (CatalogAdminComposers as any).CatalogAdminSaveOfferComposer;
        const CreateOffer = (CatalogAdminComposers as any).CatalogAdminCreateOfferComposer;

        expect(new SaveOffer(
            99, 42, '100:2', 'sound_offer', 5, 0, 0, 1, 0, '', true, 77, 0, -1, 321,
            'NORMAL', 12, 7, 'offer-token', 'Updated offer', 'save-offer-1'
        ).getMessageArray()).toEqual([
            99, 42, '100:2', 'sound_offer', 5, 0, 0, 1, 0, '', true, 77, 0, -1, 321,
            'NORMAL', 12, 7, 'offer-token', 'Updated offer', 'save-offer-1'
        ]);

        expect(new CreateOffer(
            42, '100:2', 'sound_offer', 5, 0, 0, 1, 0, '', true, 77, 0, -1, 321,
            'NORMAL', 12, 7, 'page-token', 'Created offer', 'create-offer-1'
        ).getMessageArray()).toEqual([
            42, '100:2', 'sound_offer', 5, 0, 0, 1, 0, '', true, 77, 0, -1, 321,
            'NORMAL', 12, 7, 'page-token', 'Created offer', 'create-offer-1'
        ]);
    });
});
