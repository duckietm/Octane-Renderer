import { BinaryReader } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../../codec/evawire/EvaWireDataWrapper';
import { EvaWireFormat } from '../../../../codec/evawire/EvaWireFormat';
import { OctaneMessages } from '../../../../OctaneMessages';
import { IncomingHeader } from '../../../incoming/IncomingHeader';
import { BotDialogueEvent } from '../../../incoming/room/bots';
import { OutgoingHeader } from '../../../outgoing/OutgoingHeader';
import { BotDialogueChooseComposer, BotDialogueOpenComposer } from '../../../outgoing/room/bots';
import { BotDialogueParser } from './BotDialogueParser';

// Bot -7, code 0x01020304, text "Hi", two options "A" and "B". The emulator's BotDialogueWireTest pins the same bytes.
const PAGE_HEX = 'fffffff9' + '01020304' + '0002' + '4869' + '00000002' + '0001' + '41' + '0001' + '42';
const CHOOSE_HEX = 'fffffff9' + '01020304' + '00000001';
const OPEN_HEX = 'fffffff9';
const bytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], part => parseInt(part, 16)).buffer;
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
const encode = (header: number, data: unknown[]) => hex(new EvaWireFormat().encode(header, data as never).getBuffer().slice(6));

describe('bot dialogue protocol', () =>
{
    it('registers the page event and both composers', () =>
    {
        const messages = new OctaneMessages();

        expect(messages.events.get(IncomingHeader.BOT_DIALOGUE)).toBe(BotDialogueEvent);
        expect(messages.composers.get(OutgoingHeader.BOT_DIALOGUE_OPEN)).toBe(BotDialogueOpenComposer);
        expect(messages.composers.get(OutgoingHeader.BOT_DIALOGUE_CHOOSE)).toBe(BotDialogueChooseComposer);
    });

    it('reads the bot, the code, the text and the options', () =>
    {
        const parser = new BotDialogueParser();
        const wrapper = new EvaWireDataWrapper(IncomingHeader.BOT_DIALOGUE, new BinaryReader(bytes(PAGE_HEX)));

        expect(parser.parse(wrapper)).toBe(true);
        expect(wrapper.bytesAvailable).toBe(false);
        expect(parser.botId).toBe(-7);
        expect(parser.nonce).toBe(0x01020304);
        expect(parser.text).toBe('Hi');
        expect(parser.options).toEqual([ 'A', 'B' ]);
        expect(parser.closed).toBe(false);
    });

    it('refuses a page with more options than a menu shows', () =>
    {
        const parser = new BotDialogueParser();
        const wrapper = new EvaWireDataWrapper(IncomingHeader.BOT_DIALOGUE, new BinaryReader(bytes('fffffff9' + '00000001' + '0000' + '00000007')));

        expect(parser.parse(wrapper)).toBe(false);
    });

    it('reads a closed dialogue', () =>
    {
        const parser = new BotDialogueParser();

        parser.parse(new EvaWireDataWrapper(IncomingHeader.BOT_DIALOGUE, new BinaryReader(bytes('fffffff9' + '00000000' + '0000' + '00000000'))));

        expect(parser.closed).toBe(true);
        expect(parser.options).toEqual([]);
    });

    it('writes the open and the choice as the server reads them', () =>
    {
        expect(encode(OutgoingHeader.BOT_DIALOGUE_OPEN, new BotDialogueOpenComposer(-7).getMessageArray())).toBe(OPEN_HEX);
        expect(encode(OutgoingHeader.BOT_DIALOGUE_CHOOSE, new BotDialogueChooseComposer(-7, 0x01020304, 1).getMessageArray())).toBe(CHOOSE_HEX);
    });
});
