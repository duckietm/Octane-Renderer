import { BinaryReader } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { EvaWireFormat } from '../../../../codec/evawire/EvaWireFormat';
import { OctaneMessages } from '../../../../OctaneMessages';
import { IncomingHeader } from '../../../incoming/IncomingHeader';
import { BotDialogueWindowEvent } from '../../../incoming/room/bots';
import { OutgoingHeader } from '../../../outgoing/OutgoingHeader';
import { BotDialogueWindowChooseComposer } from '../../../outgoing/room/bots';
import { BotDialogueWindowParser } from './BotDialogueWindowParser';

// Bot -7, code 0x01020304, title "T", text "Hi", action "Buy", tab "F", item "A" with icon "x_y", price 2, detail "+1",
// tab 0, up to 5, footer "C". The emulator's BotDialogueWindowTest pins the same bytes.
const WINDOW_HEX = 'fffffff9' + '01020304' + '000154' + '00024869' + '0003427579'
    + '00000001' + '000146'
    + '00000001' + '000141' + '0003785f79' + '00000002' + '00022b31' + '00000000' + '00000005'
    + '00000001' + '000143';
const CHOOSE_HEX = 'fffffff9' + '01020304' + '00000000' + '00000003';
const CLOSED_HEX = 'fffffff9' + '00000000' + '0000' + '0000' + '0000' + '00000000' + '00000000' + '00000000';
const bytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], part => parseInt(part, 16)).buffer;
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
const encode = (header: number, data: unknown[]) => hex(new EvaWireFormat().encode(header, data as never).getBuffer().slice(6));
const read = (hexText: string) =>
{
    const parser = new BotDialogueWindowParser();
    const wrapper = new EvaWireDataWrapper(IncomingHeader.BOT_DIALOGUE_WINDOW, new BinaryReader(bytes(hexText)));

    return { parser, parsed: parser.parse(wrapper), wrapper };
};

describe('bot dialogue window protocol', () =>
{
    it('registers the window event and the choice composer', () =>
    {
        const messages = new OctaneMessages();

        expect(messages.events.get(IncomingHeader.BOT_DIALOGUE_WINDOW)).toBe(BotDialogueWindowEvent);
        expect(messages.composers.get(OutgoingHeader.BOT_DIALOGUE_WINDOW_CHOOSE)).toBe(BotDialogueWindowChooseComposer);
    });

    it('reads the whole window', () =>
    {
        const { parser, parsed, wrapper } = read(WINDOW_HEX);

        expect(parsed).toBe(true);
        expect(wrapper.bytesAvailable).toBe(false);
        expect(parser.botId).toBe(-7);
        expect(parser.nonce).toBe(0x01020304);
        expect(parser.title).toBe('T');
        expect(parser.text).toBe('Hi');
        expect(parser.action).toBe('Buy');
        expect(parser.tabs).toEqual([ 'F' ]);
        expect(parser.items).toEqual([ { label: 'A', icon: 'x_y', price: 2, detail: '+1', tab: 0, maxAmount: 5 } ]);
        expect(parser.footer).toEqual([ 'C' ]);
        expect(parser.closed).toBe(false);
    });

    it('refuses more items than a window holds', () =>
    {
        expect(read('fffffff9' + '00000001' + '0000' + '0000' + '0000' + '00000000' + '00000019').parsed).toBe(false);
    });

    it('reads a closed window', () =>
    {
        const { parser, parsed } = read(CLOSED_HEX);

        expect(parsed).toBe(true);
        expect(parser.closed).toBe(true);
        expect(parser.items).toEqual([]);
    });

    it('writes the choice as the server reads it', () =>
    {
        expect(encode(OutgoingHeader.BOT_DIALOGUE_WINDOW_CHOOSE, new BotDialogueWindowChooseComposer(-7, 0x01020304, 0, 3).getMessageArray())).toBe(CHOOSE_HEX);
    });
});
