import { describe, expect, it } from 'vitest';
import { GenericErrorEnum } from './GenericErrorEnum';

describe('GenericErrorEnum', () =>
{
    it('matches the emulator generic error protocol catalog', () =>
    {
        expect(GenericErrorEnum.AUTHENTICATION_FAILED).toBe(-3);
        expect(GenericErrorEnum.CONNECTING_TO_SERVER_FAILED).toBe(-400);
        expect(GenericErrorEnum.KICKED_OUT_OF_ROOM).toBe(4008);
        expect(GenericErrorEnum.VIP_REQUIRED).toBe(4009);
        expect(GenericErrorEnum.ROOM_NAME_UNACCEPTABLE).toBe(4010);
        expect(GenericErrorEnum.CANNOT_BAN_GROUP_MEMBER).toBe(4011);
        expect(GenericErrorEnum.WRONG_ROOM_PASSWORD).toBe(-100002);
        expect(GenericErrorEnum.TRADE_STRIP_LOCKED).toBe(-13001);
    });

    it('does not assign one protocol value to multiple names', () =>
    {
        const values = Object.values(GenericErrorEnum).filter(value => typeof value === 'number');

        expect(new Set(values).size).toBe(values.length);
    });
});
