import { ILinkEventTracker } from '@octane/api';
import { describe, expect, it } from 'vitest';
import { AddLinkEventTracker, CreateLinkEvent, RemoveLinkEventTracker } from './LinkTracker';

describe('CreateLinkEvent', () =>
{
    it('reaches every tracker even when one removes itself while it handles the link', () =>
    {
        const received: string[] = [];
        const closing: ILinkEventTracker = {
            eventUrlPrefix: 'window/',
            linkReceived: () =>
            {
                received.push('closing');
                RemoveLinkEventTracker(closing);
            }
        };
        const next: ILinkEventTracker = { eventUrlPrefix: 'window/', linkReceived: () => received.push('next') };

        AddLinkEventTracker(closing);
        AddLinkEventTracker(next);
        CreateLinkEvent('window/close');
        RemoveLinkEventTracker(next);

        expect(received).toEqual([ 'closing', 'next' ]);
    });
});
