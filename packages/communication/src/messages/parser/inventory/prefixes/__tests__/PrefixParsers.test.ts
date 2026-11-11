import { BinaryReader } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../../codec/evawire/EvaWireDataWrapper';
import { UserNickIconsParser } from '../../nickicons/UserNickIconsParser';
import { ActivePrefixUpdatedParser } from '../ActivePrefixUpdatedParser';
import { CustomPrefixPurchaseFailedParser } from '../CustomPrefixPurchaseFailedParser';
import { PrefixReceivedParser } from '../PrefixReceivedParser';
import { UserPrefixesParser } from '../UserPrefixesParser';

// Field order as the emulator writes it: UserPrefixesComposer (7001), PrefixReceivedComposer (7002),
// ActivePrefixUpdatedComposer (7003), CustomPrefixPurchaseFailedComposer (7005) and UserNickIconsComposer (7004).
class PacketWriter
{
    private readonly _bytes: number[] = [];

    public int(value: number): this
    {
        this._bytes.push((value >>> 24) & 0xff, (value >>> 16) & 0xff, (value >>> 8) & 0xff, value & 0xff);

        return this;
    }

    public string(value: string): this
    {
        const encoded = new TextEncoder().encode(value);

        this._bytes.push((encoded.length >>> 8) & 0xff, encoded.length & 0xff, ...encoded);

        return this;
    }

    public prefix(id: number, text: string, color: string, icon: string, effect: string, font: string): this
    {
        return this.int(id).string(text).string(color).string(icon).string(effect).string(font);
    }

    public wrapper(): EvaWireDataWrapper
    {
        return new EvaWireDataWrapper(0, new BinaryReader(Uint8Array.from(this._bytes).buffer));
    }
}

describe('prefix parsers', () =>
{
    it('reads the owned prefix list (7001) with the active flag as an int', () =>
    {
        const parser = new UserPrefixesParser();
        const wrapper = new PacketWriter()
            .int(2)
            .prefix(4, 'VIP', '#FFD700', '⭐', 'glow', 'pixel').int(1)
            .prefix(9, 'Pro', '#FF0000,#00FF00', '', '', '').int(0)
            .wrapper();

        parser.flush();
        parser.parse(wrapper);

        expect(parser.prefixes).toEqual([
            { id: 4, text: 'VIP', color: '#FFD700', icon: '⭐', effect: 'glow', font: 'pixel', active: true },
            { id: 9, text: 'Pro', color: '#FF0000,#00FF00', icon: '', effect: '', font: '', active: false }
        ]);
        expect(wrapper.bytesAvailable).toBe(false);
    });

    it('reads a received prefix (7002)', () =>
    {
        const parser = new PrefixReceivedParser();
        const wrapper = new PacketWriter().prefix(12, 'Legend', '#00BFFF', '', 'rainbow', 'cherry').wrapper();

        parser.flush();
        parser.parse(wrapper);

        expect([parser.id, parser.text, parser.color, parser.icon, parser.effect, parser.font]).toEqual([12, 'Legend', '#00BFFF', '', 'rainbow', 'cherry']);
        expect(wrapper.bytesAvailable).toBe(false);
    });

    it('reads the active prefix (7003), and the empty form the server sends when none is worn', () =>
    {
        const parser = new ActivePrefixUpdatedParser();

        parser.flush();
        parser.parse(new PacketWriter().prefix(4, 'VIP', '#FFD700', '', 'glow', 'pixel').wrapper());

        expect([parser.prefixId, parser.text, parser.font]).toEqual([4, 'VIP', 'pixel']);

        const empty = new PacketWriter().prefix(0, '', '', '', '', '').wrapper();

        parser.flush();
        parser.parse(empty);

        expect([parser.prefixId, parser.text, parser.color, parser.icon, parser.effect, parser.font]).toEqual([0, '', '', '', '', '']);
        expect(empty.bytesAvailable).toBe(false);
    });

    it('reads the purchase failure reason (7005)', () =>
    {
        const parser = new CustomPrefixPurchaseFailedParser();

        parser.flush();
        parser.parse(new PacketWriter().string('This prefix contains a blocked word.').wrapper());

        expect(parser.message).toBe('This prefix contains a blocked word.');
    });

    it('reads the customizer data (7004): icons, settings, prefix catalog and owned prefixes', () =>
    {
        const parser = new UserNickIconsParser();
        const wrapper = new PacketWriter()
            .int(1)
            .string('star').string('Star').int(10).int(5).int(1).int(1).int(3)
            .string('prefix-icon-name')
            .int(20).int(5).int(0).int(5).int(10).int(2).int(5)
            .int(1)
            .int(17).string('Gold').string('VIP').string('#FFD700').string('').string('glow').string('pixel').int(25).int(5).int(1).int(1).int(4)
            .int(1)
            .int(4).string('Gold').string('VIP').string('#FFD700').string('').string('glow').string('pixel').int(1).int(0).int(25).int(5).int(17)
            .wrapper();

        parser.flush();
        parser.parse(wrapper);

        expect(parser.nickIcons).toEqual([{ iconKey: 'star', displayName: 'Star', points: 10, pointsType: 5, owned: true, active: true, id: 3 }]);
        expect(parser.displayOrder).toBe('prefix-icon-name');
        expect([
            parser.customPrefixMaxLength,
            parser.customPrefixPriceCredits,
            parser.customPrefixPricePoints,
            parser.customPrefixPointsType,
            parser.customPrefixFontPriceCredits,
            parser.customPrefixFontPricePoints,
            parser.customPrefixFontPointsType
        ]).toEqual([20, 5, 0, 5, 10, 2, 5]);
        expect(parser.prefixCatalog).toEqual([
            { id: 17, displayName: 'Gold', text: 'VIP', color: '#FFD700', icon: '', effect: 'glow', font: 'pixel', points: 25, pointsType: 5, owned: true, active: true, ownedPrefixId: 4 }
        ]);
        expect(parser.ownedPrefixes).toEqual([
            { id: 4, displayName: 'Gold', text: 'VIP', color: '#FFD700', icon: '', effect: 'glow', font: 'pixel', active: true, isCustom: false, points: 25, pointsType: 5, catalogPrefixId: 17 }
        ]);
        expect(wrapper.bytesAvailable).toBe(false);
    });

    it('keeps the defaults when 7004 carries only the icon list', () =>
    {
        const parser = new UserNickIconsParser();

        parser.flush();
        parser.parse(new PacketWriter().int(0).wrapper());

        expect(parser.displayOrder).toBe('icon-prefix-name');
        expect(parser.customPrefixMaxLength).toBe(15);
        expect(parser.prefixCatalog).toEqual([]);
        expect(parser.ownedPrefixes).toEqual([]);
    });
});
