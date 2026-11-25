import { describe, expect, it } from 'vitest';
import { RoomUnitChatComposer } from './RoomUnitChatComposer';
import { RoomUnitChatShoutComposer } from './RoomUnitChatShoutComposer';

describe('RoomUnitChatShoutComposer', () =>
{
    it('sends an empty chat colour when none is given, as a spoken line does', () =>
    {
        // A shout without a colour used to carry `undefined`, which cannot be written to the wire.
        expect(new RoomUnitChatShoutComposer('hello', 3).getMessageArray()).toEqual(['hello', 3, '']);
        expect(new RoomUnitChatShoutComposer('hello').getMessageArray()).toEqual(new RoomUnitChatComposer('hello').getMessageArray());
    });

    it('keeps a given style and colour', () =>
    {
        expect(new RoomUnitChatShoutComposer('hello', 5, 'ff0000').getMessageArray()).toEqual(['hello', 5, 'ff0000']);
    });
});
