import { describe, expect, it } from 'vitest';
import { RoomUnitChatWhisperComposer } from './RoomUnitChatWhisperComposer';

// The server reads talk, shout and whisper alike: text, style, colour. The whisper sent no colour.
describe('RoomUnitChatWhisperComposer', () =>
{
    it('sends the colour after the style, empty by default like talk', () =>
    {
        expect(new RoomUnitChatWhisperComposer('Bob', 'hi', 3).getMessageArray()).toEqual([ 'Bob hi', 3, '' ]);
        expect(new RoomUnitChatWhisperComposer('Bob', 'hi', 3, 'red').getMessageArray()).toEqual([ 'Bob hi', 3, 'red' ]);
    });
});
