import { BinaryReader } from '@octane/utils';
import { describe, expect, it } from 'vitest';
import { EvaWireDataWrapper } from '../../../codec/evawire/EvaWireDataWrapper';
import { EvaWireFormat } from '../../../codec/evawire/EvaWireFormat';
import { OctaneMessages } from '../../../OctaneMessages';
import { IncomingHeader } from '../../incoming/IncomingHeader';
import { PluginChannelMessageEvent } from '../../incoming/plugins';
import { OutgoingHeader } from '../../outgoing/OutgoingHeader';
import { PluginChannelActionComposer } from '../../outgoing/plugins';
import { PluginChannelMessageParser } from './PluginChannelMessageParser';

// Two strings, each a short length and UTF-8 bytes: "rp.job" and {"a":1}. The emulator's PluginChannelWireTest pins
// the same bytes, so both ends agree.
const MESSAGE_HEX = '000672702e6a6f6200077b2261223a317d';
const bytes = (hex: string) => Uint8Array.from(hex.match(/../g) ?? [], part => parseInt(part, 16)).buffer;
const hex = (buffer: ArrayBuffer) => Array.from(new Uint8Array(buffer), byte => byte.toString(16).padStart(2, '0')).join('');
const parse = (hexText: string) =>
{
    const parser = new PluginChannelMessageParser();
    const wrapper = new EvaWireDataWrapper(IncomingHeader.PLUGIN_CHANNEL_MESSAGE, new BinaryReader(bytes(hexText)));

    expect(parser.parse(wrapper)).toBe(true);
    expect(wrapper.bytesAvailable).toBe(false);

    return parser;
};

describe('generic plugin channel protocol', () =>
{
    it('registers the message event and the action composer', () =>
    {
        const messages = new OctaneMessages();

        expect(messages.events.get(IncomingHeader.PLUGIN_CHANNEL_MESSAGE)).toBe(PluginChannelMessageEvent);
        expect(messages.composers.get(OutgoingHeader.PLUGIN_CHANNEL_ACTION)).toBe(PluginChannelActionComposer);
    });

    it('reads the channel and the payload, and parses the payload once', () =>
    {
        const parser = parse(MESSAGE_HEX);

        expect(parser.channel).toBe('rp.job');
        expect(parser.payload).toBe('{"a":1}');
        expect(parser.getData()).toEqual({ a: 1 });
        expect(parser.getData()).toBe(parser.getData());
    });

    it('gives null for a payload that is not a JSON object', () =>
    {
        // "x" with payload "[1]", then "x" with payload "oops".
        expect(parse('0001780003' + '5b315d').getData()).toBeNull();
        expect(parse('0001780004' + '6f6f7073').getData()).toBeNull();
    });

    it('writes the channel then the payload, the same bytes the server reads', () =>
    {
        const composer = new PluginChannelActionComposer('rp.job', '{"a":1}');
        const encoded = new EvaWireFormat().encode(OutgoingHeader.PLUGIN_CHANNEL_ACTION, composer.getMessageArray()).getBuffer().slice(6);

        expect(composer.getMessageArray()).toEqual([ 'rp.job', '{"a":1}' ]);
        expect(hex(encoded)).toBe(MESSAGE_HEX);
    });

    it('forgets the previous message on flush', () =>
    {
        const parser = parse(MESSAGE_HEX);

        parser.flush();

        expect(parser.channel).toBe('');
        expect(parser.payload).toBe('');
    });
});
