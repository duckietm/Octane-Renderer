import { describe, expect, it } from 'vitest';
import { KEEP_PROFILE_CUSTOMIZATION, RoomUnitBackgroundComposer } from '../RoomUnitBackgroundComposer';

describe('RoomUnitBackgroundComposer', () =>
{
    it('asks the server to keep the profile banner and accent when the caller does not give them', () =>
    {
        expect(new RoomUnitBackgroundComposer(1, 2, 3, 4, 5).getMessageArray()).toEqual([ 1, 2, 3, 4, 5, KEEP_PROFILE_CUSTOMIZATION, KEEP_PROFILE_CUSTOMIZATION ]);
    });

    it('sends the profile banner and accent after the infostand values', () =>
    {
        expect(new RoomUnitBackgroundComposer(1, 2, 3, 4, 5, 6, 7).getMessageArray()).toEqual([ 1, 2, 3, 4, 5, 6, 7 ]);
    });
});
