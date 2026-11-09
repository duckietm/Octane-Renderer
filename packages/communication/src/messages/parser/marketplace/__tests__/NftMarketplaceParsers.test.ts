import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { MarketplaceConfigurationMessageParser } from '../MarketplaceConfigurationMessageParser';
import { MarketplaceOffer } from '../MarketplaceOffer';
import { MarketplaceOffersParser } from '../MarketplaceOffersParser';
import { MarketplaceOwnOffersParser } from '../MarketplaceOwnOffersParser';
import { NftMarketplaceBuyResultParser } from '../NftMarketplaceBuyResultParser';
import { NftMarketplaceItemStatsParser } from '../NftMarketplaceItemStatsParser';

// The Collectibles marketplace in the field order Polaris writes and AIR reads.

const wrap = (writer: BinaryWriter) => new EvaWireDataWrapper(0, new BinaryReader(writer.getBuffer()));

const writeNftOffer = (writer: BinaryWriter, offerId: number, status: number) =>
{
    writer.writeInt(offerId);
    writer.writeInt(status);
    writer.writeInt(5);
    writer.writeString('nft_h23_bunny');
    writer.writeInt(4521);
    writer.writeInt(2);
};

describe('Collectibles marketplace parsers', () =>
{
    it('reads a collectible search result between furni offers', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(2);
        writeNftOffer(writer, 41, 1);
        writer.writeInt(100);
        writer.writeInt(0);
        writer.writeInt(90);
        writer.writeInt(3);
        // A wall furni after it: the stream has to stay in step.
        writer.writeInt(42);
        writer.writeInt(1);
        writer.writeInt(2);
        writer.writeInt(777);
        writer.writeString('2.0');
        writer.writeInt(51);
        writer.writeInt(0);
        writer.writeInt(50);
        writer.writeInt(1);
        writer.writeInt(2);

        const parser = new MarketplaceOffersParser();
        parser.flush();

        expect(parser.parse(wrap(writer))).toBe(true);
        expect(parser.offers).toHaveLength(2);

        const nft = parser.offers[0];
        expect(nft.isNft).toBe(true);
        expect(nft.furniType).toBe(MarketplaceOffer.TYPE_NFT);
        expect(nft.productCode).toBe('nft_h23_bunny');
        expect(nft.furniId).toBe(4521);
        expect(nft.nftFurniType).toBe(2);
        expect(nft.price).toBe(100);
        expect(nft.averagePrice).toBe(90);
        expect(nft.offerCount).toBe(3);

        expect(parser.offers[1].isNft).toBe(false);
        expect(parser.offers[1].extraData).toBe('2.0');
        expect(parser.totalItemsFound).toBe(2);
    });

    it('reads a collectible among the own offers', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(0);
        writer.writeInt(1);
        writeNftOffer(writer, 41, 2);
        writer.writeInt(100);
        writer.writeInt(0);
        writer.writeInt(0);

        const parser = new MarketplaceOwnOffersParser();
        parser.flush();

        expect(parser.parse(wrap(writer))).toBe(true);
        expect(parser.offers[0].isNft).toBe(true);
        expect(parser.offers[0].productCode).toBe('nft_h23_bunny');
        expect(parser.offers[0].status).toBe(2);
        expect(parser.offers[0].price).toBe(100);
    });

    it('reads the configuration with and without the collectibles part', () =>
    {
        const writer = new BinaryWriter();
        writer.writeByte(1);
        [ 1, 1, 5, 1, 1000000, 48, 7 ].forEach(value => writer.writeInt(value));

        const old = new MarketplaceConfigurationMessageParser();
        old.flush();
        expect(old.parse(wrap(writer))).toBe(true);
        expect(old.nftEnabled).toBe(false);

        [ 0, 1000000, 2147483647 ].forEach(value => writer.writeInt(value));
        writer.writeByte(1);
        [ 1, 100000, 10080, 25, 5, 2147483647 ].forEach(value => writer.writeInt(value));

        const parser = new MarketplaceConfigurationMessageParser();
        parser.flush();
        expect(parser.parse(wrap(writer))).toBe(true);
        expect(parser.displayTime).toBe(7);
        expect(parser.halfTaxLimit).toBe(2147483647);
        expect(parser.nftEnabled).toBe(true);
        expect(parser.nftMinimumPrice).toBe(1);
        expect(parser.nftMaximumPrice).toBe(100000);
        expect(parser.nftOfferMinutes).toBe(10080);
        expect(parser.nftMaximumOpenOffers).toBe(25);
        expect(parser.nftSellingFeePercentage).toBe(5);
    });

    it('reads the buy result with its 64-bit offer id', () =>
    {
        const writer = new BinaryWriter();
        writer.writeString('SUCCESS');
        writer.writeInt(0);
        writer.writeInt(41);
        writer.writeInt(100);

        const parser = new NftMarketplaceBuyResultParser();
        parser.flush();

        expect(parser.parse(wrap(writer))).toBe(true);
        expect(parser.result).toBe(NftMarketplaceBuyResultParser.RESULT_SUCCESS);
        expect(parser.offerId).toBe(41);
        expect(parser.price).toBe(100);
    });

    it('reads the item stats', () =>
    {
        const writer = new BinaryWriter();
        [ 80, 3, 30, 1, -2, 75, 4, 70, 80 ].forEach(value => writer.writeInt(value));

        const parser = new NftMarketplaceItemStatsParser();
        parser.flush();

        expect(parser.parse(wrap(writer))).toBe(true);
        expect(parser.averagePrice).toBe(80);
        expect(parser.offerCount).toBe(3);
        expect(parser.dayOffsets).toEqual([ -2 ]);
        expect(parser.averagePrices).toEqual([ 75 ]);
        expect(parser.soldAmounts).toEqual([ 4 ]);
        expect(parser.lowestCurrentPrice).toBe(70);
        expect(parser.suggestedPrice).toBe(80);
    });
});
