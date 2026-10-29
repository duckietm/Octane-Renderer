import { BinaryReader, BinaryWriter } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { EvaWireFormat } from '../../../../codec/evawire/EvaWireFormat';
import { OctaneMessages } from '../../../../OctaneMessages';
import { IncomingHeader } from '../../../incoming/IncomingHeader';
import { ChestCoinsEvent, ChestFurniChunkEvent, ChestFurniDeltaEvent, ChestOpenEvent, ChestSettingsUpdatedEvent, ChestUpgradeResultEvent, WiredTradeCancelledEvent, WiredTradeCompletedEvent, WiredTradeErrorEvent, WiredTradeItemsEvent, WiredTradeOpenEvent, WiredTransactionFailEvent, WiredTransactionSuccessEvent } from '../../../incoming/room/furniture';
import { OutgoingHeader } from '../../../outgoing/OutgoingHeader';
import { ChestCloseComposer, ChestOpenComposer, ChestSaveNotificationsComposer, ChestSaveOptionsComposer, ChestSaveSettingsComposer, ChestStartDepositComposer, ChestUpgradeCapacityComposer, ChestWithdrawAllComposer, ChestWithdrawCoinsComposer, ChestWithdrawFurniComposer, WiredChestLockComposer, WiredTradeAcceptComposer, WiredTradeCancelComposer, WiredTradeOfferItemsComposer } from '../../../outgoing/room/furniture/chest';
import { ChestCoinsMessageParser } from './ChestCoinsMessageParser';
import { ChestFurniChunkMessageParser } from './ChestFurniChunkMessageParser';
import { ChestFurniDeltaMessageParser } from './ChestFurniDeltaMessageParser';
import { ChestOpenMessageParser } from './ChestOpenMessageParser';
import { ChestSettingsUpdatedMessageParser } from './ChestSettingsUpdatedMessageParser';
import { ChestUpgradeResultMessageParser } from './ChestUpgradeResultMessageParser';
import { WiredTradeErrorMessageParser } from './WiredTradeErrorMessageParser';
import { WiredTradeItemsMessageParser } from './WiredTradeItemsMessageParser';
import { WIRED_TRADE_REQUIREMENT_ANY_COINS, WIRED_TRADE_REQUIREMENT_RULES, WIRED_TRADE_RULES_AUTO, WIRED_TRADE_RULES_MULTIPLIER, WiredTradeOpenMessageParser } from './WiredTradeOpenMessageParser';
import { WiredTransactionFailMessageParser } from './WiredTransactionFailMessageParser';
import { WIRED_TRANSACTION_SUCCESS_DEPOSIT, WIRED_TRANSACTION_SUCCESS_REWARD, WiredTransactionSuccessMessageParser } from './WiredTransactionSuccessMessageParser';

// Field orders: checked against the AIR WIN63-202610131318 client. Incoming: the parsers in
// communication.messages.parser.userdefinedroomevents.wiredtrading.chests / .trade, ChestStorage + ChestItemType,
// TradeRequirement, TradeRequirementRules / RulesDefinition / Rule, TradeRequirementNode, WiredTransactionSuccessContents
// and the normal trading item list the trade items parser reuses. Outgoing: the chest, lock and wired trade composers
// WiredChestController, WiredChestWrapperView, ChestSettingsUI, ChestNotificationSettingsUI, the chest sub-controllers,
// WiredChestUpgradeConfirmationView, WiredMenuChestsTab and WiredTradingModel send. The ids are ours, never the
// official rotated table.

const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
/** The frame body a composer produces (length + header stripped). */
const body = (header: number, values: unknown[]) => hex(new EvaWireFormat().encode(header, values).getBuffer().slice(6));
const wrap = (writer: BinaryWriter) => new EvaWireDataWrapper(0, new BinaryReader(writer.getBuffer() ?? new ArrayBuffer(0)));
const int = (value: number) => (value >>> 0).toString(16).padStart(8, '0');
const bool = (value: boolean) => (value ? '01' : '00');
const str = (value: string) => (new TextEncoder().encode(value).length).toString(16).padStart(4, '0') + hex(new TextEncoder().encode(value).buffer);

/** A ChestStorage row (AIR ChestStorage) with legacy stuff data. */
const writeStorage = (writer: BinaryWriter, id: number, wall: boolean, typeId: number) =>
{
    writer.writeInt(id);
    writer.writeInt(0);
    writer.writeInt(0);
    writer.writeInt(77);
    writer.writeByte(wall ? 1 : 0);
    writer.writeInt(typeId);
    writer.writeString(wall ? '9' : '');
    writer.writeByte(1);
    writer.writeInt(1);
    writer.writeInt(0);
    writer.writeString('state');
    if(!wall) writer.writeInt(5);
};

/** A trade item (AIR, the normal trading item layout). */
const writeTradeItem = (writer: BinaryWriter, itemId: number, type: 'I' | 'S', typeId: number) =>
{
    writer.writeInt(itemId);
    writer.writeString(type);
    writer.writeInt(itemId + 1000);
    writer.writeInt(typeId);
    writer.writeInt(1);
    writer.writeByte(1);
    writer.writeInt(0);
    writer.writeString('');
    writer.writeInt(15);
    writer.writeInt(10);
    writer.writeInt(2026);
    if(type === 'S') writer.writeInt(0);
};

/** int n, TradeRequirementNode[n]: byte type, int amount, if furni: bool wall, int typeId, string posterId. */
const writeRule = (writer: BinaryWriter) =>
{
    writer.writeInt(2);
    writer.writeByte(0);
    writer.writeInt(50);
    writer.writeByte(1);
    writer.writeInt(3);
    writer.writeByte(0);
    writer.writeInt(202);
    writer.writeString('');
};

describe('wired chest AIR protocol', () =>
{
    it('registers every chest and trade message on our header ids', () =>
    {
        const messages = new OctaneMessages();
        const outgoing: [number, unknown][] = [
            [OutgoingHeader.CHEST_OPEN, ChestOpenComposer], [OutgoingHeader.CHEST_CLOSE, ChestCloseComposer],
            [OutgoingHeader.CHEST_START_DEPOSIT, ChestStartDepositComposer], [OutgoingHeader.CHEST_WITHDRAW_ALL_FURNI, ChestWithdrawAllComposer],
            [OutgoingHeader.CHEST_WITHDRAW_FURNI, ChestWithdrawFurniComposer], [OutgoingHeader.CHEST_WITHDRAW, ChestWithdrawCoinsComposer],
            [OutgoingHeader.CHEST_SAVE_SETTINGS, ChestSaveSettingsComposer], [OutgoingHeader.CHEST_SAVE_OPTIONS, ChestSaveOptionsComposer],
            [OutgoingHeader.CHEST_SAVE_NOTIFICATIONS, ChestSaveNotificationsComposer], [OutgoingHeader.CHEST_UPGRADE_CAPACITY, ChestUpgradeCapacityComposer],
            [OutgoingHeader.WIRED_CHEST_LOCK, WiredChestLockComposer], [OutgoingHeader.WIRED_TRADE_OFFER_ITEMS, WiredTradeOfferItemsComposer],
            [OutgoingHeader.WIRED_TRADE_ACCEPT, WiredTradeAcceptComposer], [OutgoingHeader.WIRED_TRADE_CANCEL, WiredTradeCancelComposer]
        ];
        const incoming: [number, unknown][] = [
            [IncomingHeader.CHEST_OPEN, ChestOpenEvent], [IncomingHeader.CHEST_SETTINGS_UPDATED, ChestSettingsUpdatedEvent],
            [IncomingHeader.CHEST_UPGRADE_RESULT, ChestUpgradeResultEvent], [IncomingHeader.CHEST_COINS, ChestCoinsEvent],
            [IncomingHeader.CHEST_FURNI_CHUNK, ChestFurniChunkEvent], [IncomingHeader.CHEST_FURNI_DELTA, ChestFurniDeltaEvent],
            [IncomingHeader.WIRED_TRANSACTION_FAIL, WiredTransactionFailEvent], [IncomingHeader.WIRED_TRANSACTION_SUCCESS, WiredTransactionSuccessEvent],
            [IncomingHeader.WIRED_TRADE_ERROR, WiredTradeErrorEvent], [IncomingHeader.WIRED_TRADE_OPEN, WiredTradeOpenEvent],
            [IncomingHeader.WIRED_TRADE_ITEMS, WiredTradeItemsEvent], [IncomingHeader.WIRED_TRADE_CANCELLED, WiredTradeCancelledEvent],
            [IncomingHeader.WIRED_TRADE_COMPLETED, WiredTradeCompletedEvent]
        ];

        for(const [header, composer] of outgoing) expect(messages.composers.get(header), `outgoing ${ header }`).toBe(composer);
        for(const [header, event] of incoming) expect(messages.events.get(header), `incoming ${ header }`).toBe(event);

        // Within one direction an id may only name one message.
        const count = (registry: object, header: number) => Object.values(registry).filter(value => value === header).length;
        for(const [header] of outgoing) expect(count(OutgoingHeader, header), `OutgoingHeader ${ header }`).toBe(1);
        for(const [header] of incoming) expect(count(IncomingHeader, header), `IncomingHeader ${ header }`).toBe(1);

        // The pre-AIR deposit messages and the separate Wired upgrade are gone (AIR deposits through the wired trade).
        for(const header of [9313, 9321, 9325, 9345])
            expect(Object.values(OutgoingHeader).includes(header), `OutgoingHeader ${ header }`).toBe(false);
    });

    it('serialises the chest composers in AIR field order', () =>
    {
        expect(body(1595, new ChestOpenComposer(7).getMessageArray())).toBe(int(7));
        expect(body(1154, new ChestCloseComposer(7).getMessageArray())).toBe(int(7));
        expect(body(3268, new ChestStartDepositComposer(7).getMessageArray())).toBe(int(7));
        expect(body(57, new ChestWithdrawAllComposer(7).getMessageArray())).toBe(int(7));
        expect(body(715, new ChestWithdrawFurniComposer(7, true, 4001, '12', 3).getMessageArray()))
            .toBe(int(7) + bool(true) + int(4001) + str('12') + int(3));
        expect(body(3731, new ChestWithdrawCoinsComposer(7, 250).getMessageArray())).toBe(int(7) + int(250));
        expect(body(3274, new ChestSaveSettingsComposer(7, 'Box', 'Desc', true, false, 2, 5, 3, true).getMessageArray()))
            .toBe(int(7) + str('Box') + str('Desc') + bool(true) + bool(false) + int(2) + int(5) + int(3) + bool(true));
        expect(body(1211, new ChestSaveOptionsComposer(7, true, false, 900).getMessageArray()))
            .toBe(int(7) + bool(true) + bool(false) + int(900));
        expect(body(3937, new ChestSaveNotificationsComposer(7, 2, true, false, true, false, true).getMessageArray()))
            .toBe(int(7) + int(2) + bool(true) + bool(false) + bool(true) + bool(false) + bool(true));
        expect(body(2964, new ChestUpgradeCapacityComposer(7, 2).getMessageArray())).toBe(int(7) + int(2));
    });

    it('serialises the lock and wired trade composers in AIR field order', () =>
    {
        expect(body(1323, new WiredChestLockComposer(true, false).getMessageArray())).toBe(bool(true) + bool(false));
        expect(body(1774, new WiredTradeOfferItemsComposer(false, 11, 12).getMessageArray())).toBe(bool(false) + int(2) + int(11) + int(12));
        expect(body(609, new WiredTradeAcceptComposer(false).getMessageArray())).toBe(bool(false));
        expect(body(609, new WiredTradeAcceptComposer(true).getMessageArray())).toBe(bool(true));
        expect(body(1898, new WiredTradeCancelComposer().getMessageArray())).toBe('');
    });

    it('reads the chest open, settings, upgrade and coin messages', () =>
    {
        const open = new ChestOpenMessageParser();
        expect(open.parse(wrap(new BinaryWriter().writeInt(7) as BinaryWriter))).toBe(true);
        expect(open.chestId).toBe(7);

        const settings = new ChestSettingsUpdatedMessageParser();
        expect(settings.parse(wrap(new BinaryWriter().writeInt(7).writeByte(1) as BinaryWriter))).toBe(true);
        expect([settings.chestId, settings.isNotificationPreferences]).toEqual([7, true]);

        const upgrade = new ChestUpgradeResultMessageParser();
        expect(upgrade.parse(wrap(new BinaryWriter().writeInt(7).writeInt(0) as BinaryWriter))).toBe(true);
        expect([upgrade.chestId, upgrade.resultCode, upgrade.successful]).toEqual([7, 0, true]);

        const coins = new ChestCoinsMessageParser();
        const coinsWrapper = wrap(new BinaryWriter().writeInt(7).writeInt(1234).writeByte(0) as BinaryWriter);
        expect(coins.parse(coinsWrapper)).toBe(true);
        expect(coinsWrapper.bytesAvailable).toBe(false);
        expect([coins.chestId, coins.coins, coins.isUpdate]).toEqual([7, 1234, false]);
    });

    it('reads furni chest fragments and updates with ChestStorage rows', () =>
    {
        const chunk = new BinaryWriter();
        chunk.writeInt(7).writeInt(2).writeInt(0).writeInt(2);
        writeStorage(chunk, 101, false, 4001);
        writeStorage(chunk, 102, true, 4002);
        const chunkWrapper = wrap(chunk);
        const chunkParser = new ChestFurniChunkMessageParser();
        expect(chunkParser.parse(chunkWrapper)).toBe(true);
        expect(chunkWrapper.bytesAvailable).toBe(false);
        expect([chunkParser.chestId, chunkParser.totalFragments, chunkParser.fragmentNo]).toEqual([7, 2, 0]);
        expect(chunkParser.items.map(item => [item.inventoryId, item.transactionId, item.wallItem, item.baseItemId, item.legacyPosterId, item.extra]))
            .toEqual([[101, 77, false, 4001, '', 5], [102, 77, true, 4002, '9', 0]]);

        const update = new BinaryWriter();
        update.writeInt(7).writeInt(2).writeInt(101).writeInt(102).writeInt(1);
        writeStorage(update, 103, false, 4003);
        const updateWrapper = wrap(update);
        const updateParser = new ChestFurniDeltaMessageParser();
        expect(updateParser.parse(updateWrapper)).toBe(true);
        expect(updateWrapper.bytesAvailable).toBe(false);
        expect(updateParser.removedIds).toEqual([101, 102]);
        expect(updateParser.added.map(item => item.inventoryId)).toEqual([103]);
    });

    it('reads transaction fail, trade error and success with and without reward contents', () =>
    {
        const fail = new WiredTransactionFailMessageParser();
        expect(fail.parse(wrap(new BinaryWriter().writeInt(4) as BinaryWriter))).toBe(true);
        expect(fail.failureReason).toBe(4);

        const error = new WiredTradeErrorMessageParser();
        expect(error.parse(wrap(new BinaryWriter().writeInt(3) as BinaryWriter))).toBe(true);
        expect(error.tradeErrorId).toBe(3);

        const success = new WiredTransactionSuccessMessageParser();
        expect(success.parse(wrap(new BinaryWriter().writeInt(WIRED_TRANSACTION_SUCCESS_DEPOSIT) as BinaryWriter))).toBe(true);
        expect([success.successType, success.hasRewardContents]).toEqual([0, false]);

        // A reward without contents is legal: nothing follows the type.
        expect(success.parse(wrap(new BinaryWriter().writeInt(WIRED_TRANSACTION_SUCCESS_REWARD) as BinaryWriter))).toBe(true);
        expect([success.successType, success.hasRewardContents]).toEqual([2, false]);

        const reward = new BinaryWriter();
        reward.writeInt(WIRED_TRANSACTION_SUCCESS_REWARD);
        writeRule(reward);
        reward.writeString('Well done');
        reward.writeByte(1);
        const rewardWrapper = wrap(reward);
        expect(success.parse(rewardWrapper)).toBe(true);
        expect(rewardWrapper.bytesAvailable).toBe(false);
        expect(success.rewardRule).toEqual({ nodes: [
            { type: 0, amount: 50, itemType: null },
            { type: 1, amount: 3, itemType: { isWallItem: false, typeId: 202, legacyPosterId: '' } }
        ] });
        expect([success.rewardText, success.openByDefault, success.hasRewardContents]).toEqual(['Well done', true, true]);
    });

    it('reads reward and trade rules with more nodes and alternatives than the contract editor allows', () =>
    {
        /** int n, n furni nodes (AIR TradeRequirementRule has no node cap). */
        const writeLongRule = (writer: BinaryWriter, count: number) =>
        {
            writer.writeInt(count);
            for(let i = 0; i < count; i++) writer.writeByte(1).writeInt(i + 1).writeByte(0).writeInt(4000 + i).writeString('');
        };

        const reward = new BinaryWriter();
        reward.writeInt(WIRED_TRANSACTION_SUCCESS_REWARD);
        writeLongRule(reward, 7);
        reward.writeString('Lots').writeByte(0);
        const rewardWrapper = wrap(reward);
        const success = new WiredTransactionSuccessMessageParser();
        expect(success.parse(rewardWrapper)).toBe(true);
        expect(rewardWrapper.bytesAvailable).toBe(false);
        expect(success.rewardRule.nodes.map(node => node.itemType.typeId)).toEqual([4000, 4001, 4002, 4003, 4004, 4005, 4006]);
        expect([success.rewardText, success.openByDefault]).toEqual(['Lots', false]);

        const open = new BinaryWriter();
        open.writeInt(WIRED_TRADE_REQUIREMENT_RULES).writeString('').writeString('generic');
        open.writeByte(1).writeInt(4);
        for(let i = 0; i < 4; i++) writeLongRule(open, 6);
        open.writeByte(1);
        writeLongRule(open, 8);
        open.writeInt(0);
        open.writeByte(0).writeByte(0).writeInt(30);
        const openWrapper = wrap(open);
        const openParser = new WiredTradeOpenMessageParser();
        expect(openParser.parse(openWrapper)).toBe(true);
        expect(openWrapper.bytesAvailable).toBe(false);
        expect(openParser.giveRules.map(rule => rule.nodes.length)).toEqual([6, 6, 6, 6]);
        expect(openParser.getRule.nodes).toHaveLength(8);
        expect(openParser.timeoutSeconds).toBe(30);
    });

    it('refuses a rule count that cannot fit in the packet instead of looping', () =>
    {
        const reward = new BinaryWriter();
        reward.writeInt(WIRED_TRANSACTION_SUCCESS_REWARD).writeInt(0x7fffffff).writeByte(0).writeInt(5);
        const success = new WiredTransactionSuccessMessageParser();
        expect(success.parse(wrap(reward))).toBe(false);
        expect(success.hasRewardContents).toBe(false);

        const open = new BinaryWriter();
        open.writeInt(WIRED_TRADE_REQUIREMENT_RULES).writeString('').writeString('generic').writeByte(1).writeInt(-1);
        expect(new WiredTradeOpenMessageParser().parse(wrap(open))).toBe(false);
    });

    it('reads a trade open with a plain requirement', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(WIRED_TRADE_REQUIREMENT_ANY_COINS).writeString('You get a hug').writeString('generic');
        writer.writeByte(1).writeByte(0).writeInt(60);
        const wrapper = wrap(writer);
        const parser = new WiredTradeOpenMessageParser();
        expect(parser.parse(wrapper)).toBe(true);
        expect(wrapper.bytesAvailable).toBe(false);
        expect([parser.requirementType, parser.youGetText, parser.layoutType, parser.giveRules, parser.getRule]).toEqual([0, 'You get a hug', 'generic', null, null]);
        expect([parser.showRequirementsImmediate, parser.overridePreviousTrade, parser.timeoutSeconds]).toEqual([true, false, 60]);
    });

    it.each([
        [WIRED_TRADE_RULES_MULTIPLIER, 3, { multiplier: 3, autoMultiplierMax: 0 }],
        [WIRED_TRADE_RULES_AUTO, 9, { multiplier: 1, autoMultiplierMax: 9 }]
    ])('reads a trade open with rules of type %i', (rulesType, value, expected) =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(WIRED_TRADE_REQUIREMENT_RULES).writeString('').writeString('generic');
        writer.writeByte(1).writeInt(1);
        writeRule(writer);
        writer.writeByte(1);
        writeRule(writer);
        writer.writeInt(rulesType).writeInt(value);
        writer.writeByte(0).writeByte(1).writeInt(30);
        const wrapper = wrap(writer);
        const parser = new WiredTradeOpenMessageParser();
        expect(parser.parse(wrapper)).toBe(true);
        expect(wrapper.bytesAvailable).toBe(false);
        expect(parser.giveRules).toHaveLength(1);
        expect(parser.giveRules[0].nodes).toHaveLength(2);
        expect(parser.getRule.nodes[1].itemType.typeId).toBe(202);
        expect({ multiplier: parser.multiplier, autoMultiplierMax: parser.autoMultiplierMax }).toEqual(expected);
        expect([parser.rulesType, parser.showRequirementsImmediate, parser.overridePreviousTrade, parser.timeoutSeconds]).toEqual([rulesType, false, true, 30]);
    });

    it('reads the trade items with the normal trading item layout, canAccept and extra', () =>
    {
        const writer = new BinaryWriter();
        writer.writeInt(42).writeInt(2);
        writeTradeItem(writer, 11, 'S', 4001);
        writeTradeItem(writer, 12, 'I', 4002);
        writer.writeInt(2).writeInt(0);
        writer.writeInt(-1).writeInt(1);
        writeTradeItem(writer, 13, 'S', 4003);
        writer.writeInt(1).writeInt(25);
        writer.writeByte(1).writeInt(2);
        const wrapper = wrap(writer);
        const parser = new WiredTradeItemsMessageParser();
        expect(parser.parse(wrapper)).toBe(true);
        expect(wrapper.bytesAvailable).toBe(false);
        expect(parser.firstUserID).toBe(42);
        expect(parser.firstUserItemArray.map(item => [item.itemId, item.furniType, item.spriteId, item.isWallItem])).toEqual([[11, 'S', 4001, false], [12, 'I', 4002, true]]);
        expect([parser.firstUserNumItems, parser.firstUserNumCredits]).toEqual([2, 0]);
        expect(parser.secondUserItemArray.map(item => item.spriteId)).toEqual([4003]);
        expect([parser.secondUserNumItems, parser.secondUserNumCredits, parser.canAccept, parser.extra]).toEqual([1, 25, true, 2]);
    });
});
