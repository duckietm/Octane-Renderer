import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../codec/evawire/EvaWireDataWrapper';
import { EvaWireFormat } from '../../../codec/evawire/EvaWireFormat';
import { OctaneMessages } from '../../../OctaneMessages';
import { IncomingHeader } from '../../incoming/IncomingHeader';
import { WiredContractContentsEvent, WiredContractOpenEvent, WiredContractUpdateResultEvent } from '../../incoming/roomevents';
import { OutgoingHeader } from '../../outgoing/OutgoingHeader';
import { GetWiredContractContentsComposer, UpdateWiredContractComposer } from '../../outgoing/roomevents';
import { WiredContractContentsParser } from './WiredContractContentsParser';
import { IWiredContractContents } from './WiredContractData';
import { WiredContractOpenParser } from './WiredContractOpenParser';
import { WiredContractUpdateResultParser } from './WiredContractUpdateResultParser';

// AIR field order (WiredContractController, AbstractContract, PaymentContract, RewardContract). The same payment
// fixture is pinned by the emulator's WiredNativeContractWireTest, so both ends agree byte for byte.
const PAYMENT_HEX = '0000002a00000100000001000000020000000007010000000201000000010001390000010003506179000767656e65726963';
const payment: IWiredContractContents = {
    contractId: 42,
    contractType: 0,
    definition: { youGiveRule: [ { nodes: [ { type: 0, amount: 7, itemType: null }, { type: 1, amount: 2, itemType: { isWallItem: true, typeId: 1, legacyPosterId: '9' } } ] } ], youGetRule: null },
    paymentMode: 1,
    receiveText: 'Pay',
    layoutType: 'generic',
    rewardCategory: 11,
    showDialog: false,
    rewardText: ''
};
const bytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], part => parseInt(part, 16)).buffer;
const wrap = (buffer: ArrayBuffer) => new EvaWireDataWrapper(IncomingHeader.WIRED_CONTRACT_CONTENTS, new BinaryReader(buffer));
const encode = (contents: IWiredContractContents) => new EvaWireFormat().encode(OutgoingHeader.WIRED_CONTRACT_UPDATE, new UpdateWiredContractComposer(contents).getMessageArray()).getBuffer().slice(6);
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');

describe('native wired contract editor protocol', () =>
{
    it('registers the open / contents / result events and both composers', () =>
    {
        const messages = new OctaneMessages();

        expect(messages.events.get(IncomingHeader.WIRED_CONTRACT_OPEN)).toBe(WiredContractOpenEvent);
        expect(messages.events.get(IncomingHeader.WIRED_CONTRACT_CONTENTS)).toBe(WiredContractContentsEvent);
        expect(messages.events.get(IncomingHeader.WIRED_CONTRACT_UPDATE_RESULT)).toBe(WiredContractUpdateResultEvent);
        expect(messages.composers.get(OutgoingHeader.WIRED_CONTRACT_GET_CONTENTS)).toBe(GetWiredContractContentsComposer);
        expect(messages.composers.get(OutgoingHeader.WIRED_CONTRACT_UPDATE)).toBe(UpdateWiredContractComposer);
        expect(new GetWiredContractContentsComposer(42).getMessageArray()).toEqual([ 42 ]);
    });

    it('writes short contract types, byte node types and the poster-bearing furni tuple', () =>
    {
        expect(hex(encode(payment))).toBe(PAYMENT_HEX);

        const parser = new WiredContractContentsParser();
        const wrapper = wrap(bytes(PAYMENT_HEX));

        expect(parser.parse(wrapper)).toBe(true);
        expect(wrapper.bytesAvailable).toBe(false);
        expect({ ...parser }).toEqual(payment);
    });

    it.each([ 1, 2 ] as const)('round-trips type %i without keeping the previous payment options', kind =>
    {
        const contents: IWiredContractContents = {
            ...payment,
            contractType: kind,
            definition: { youGiveRule: kind === 1 ? payment.definition.youGiveRule : null, youGetRule: { nodes: [ { type: 0, amount: 11, itemType: null } ] } },
            paymentMode: 0,
            receiveText: '',
            layoutType: 'generic',
            rewardCategory: kind === 2 ? 13 : 11,
            showDialog: kind === 2,
            rewardText: kind === 2 ? 'Thanks ♥' : ''
        };
        const parser = new WiredContractContentsParser();

        expect(parser.parse(wrap(bytes(PAYMENT_HEX)))).toBe(true);
        expect(parser.parse(wrap(encode(contents)))).toBe(true);
        expect({ ...parser }).toEqual(contents);
    });

    it('keeps an absent rule apart from an empty one and reads the open / result envelopes', () =>
    {
        const contents = { ...payment, paymentMode: 0, definition: { youGiveRule: [], youGetRule: null } };
        const parser = new WiredContractContentsParser();

        expect(parser.parse(wrap(encode(contents)))).toBe(true);
        expect(parser.definition).toEqual({ youGiveRule: [], youGetRule: null });

        const open = new WiredContractOpenParser();

        expect(open.parse(wrap(bytes('0000002a')))).toBe(true);
        expect(open.contractId).toBe(42);

        const writer = new BinaryWriter();

        writer.writeInt(42);
        writer.writeByte(0);
        writer.writeString('invalid_rules');

        const result = new WiredContractUpdateResultParser();

        expect(result.parse(wrap(writer.getBuffer()))).toBe(true);
        expect([ result.contractId, result.isSuccess, result.failCode ]).toEqual([ 42, false, 'invalid_rules' ]);
    });

    it('refuses bad counts, node types and truncated tuples', () =>
    {
        const fixtures = [ '0000002a0000017fffffff', '0000002a0000010000000100000006', '0000002a00000100000001000000010200000007', PAYMENT_HEX.slice(0, 60) ];

        for(const fixture of fixtures) expect(new WiredContractContentsParser().parse(wrap(bytes(fixture)))).toBe(false);
    });

    it('refuses a furni node with no item type instead of writing a short packet', () =>
    {
        expect(() => new UpdateWiredContractComposer({ ...payment, definition: { youGiveRule: [ { nodes: [ { type: 1, amount: 1, itemType: null } ] } ], youGetRule: null } })).toThrow();
    });
});
