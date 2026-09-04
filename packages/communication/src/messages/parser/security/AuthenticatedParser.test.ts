import { IMessageDataWrapper } from '@nitrots/api';
import { describe, expect, it } from 'vitest';
import { AuthenticatedParser } from './AuthenticatedParser';

describe('AuthenticatedParser', () =>
{
    it('reads optional Polaris session-resume metadata', () =>
    {
        const values: unknown[] = [ true, 42, 'recovery-token' ];
        const wrapper = {
            get bytesAvailable()
            {
                return values.length > 0;
            },
            readBoolean: () => values.shift() as boolean,
            readInt: () => values.shift() as number,
            readString: () => values.shift() as string
        } as unknown as IMessageDataWrapper;
        const parser = new AuthenticatedParser();

        expect(parser.parse(wrapper)).toBe(true);
        expect(parser.sessionResumed).toBe(true);
        expect(parser.roomId).toBe(42);
        expect(parser.recoveryToken).toBe('recovery-token');
    });

    it('keeps compatibility with emulators that send an empty authenticated packet', () =>
    {
        const wrapper = { bytesAvailable: false } as unknown as IMessageDataWrapper;
        const parser = new AuthenticatedParser();

        expect(parser.parse(wrapper)).toBe(true);
        expect(parser.sessionResumed).toBe(false);
        expect(parser.roomId).toBe(0);
        expect(parser.recoveryToken).toBe('');
    });
});
