import { describe, expect, it } from 'vitest';
import { VariableFxStatusUpdateParser } from './VariableFxStatusUpdateParser';

const wrapper = (values: unknown[]) =>
{
    let index = 0;

    return {
        readInt: () => values[index++] as number,
        readString: () => values[index++] as string,
        readBoolean: () => values[index++] as boolean,
        readShort: () => values[index++] as number,
        readDouble: () => values[index++] as number,
        readByte: () => values[index++] as number,
        readBytes: () => null,
        readFloat: () => values[index++] as number,
        header: 3889,
        bytesAvailable: false
    } as never;
};

describe('VariableFxStatusUpdateParser', () =>
{
    it('reads one entry without overrides', () =>
    {
        const parser = new VariableFxStatusUpdateParser();

        parser.parse(wrapper([true, 1, '19199|score', true, false, 5001, 0, 70, false, 0]));

        expect(parser.initializeAll).toBe(true);
        expect(parser.statuses).toHaveLength(1);
        expect(parser.statuses[0].statusKey).toBe('19199|score');
        expect(parser.statuses[0].entityId).toBe(5001);
        expect(parser.statuses[0].value).toBe(70);
        expect(parser.statuses[0].hasOverrides).toBe(false);
    });

    it('reads the two override bounds only when the flag is set', () =>
    {
        const parser = new VariableFxStatusUpdateParser();

        parser.parse(wrapper([false, 1, '19199|hp', false, true, 42, 0, 30, true, 0, 0, 0, 100, 0]));

        expect(parser.statuses[0].hasOverrides).toBe(true);
        expect(parser.statuses[0].overrideMinValue).toBe(0);
        expect(parser.statuses[0].overrideMaxValue).toBe(100);
    });

    it('recombines a value that does not fit in one int', () =>
    {
        const parser = new VariableFxStatusUpdateParser();

        parser.parse(wrapper([false, 1, '19199|hp', false, false, 42, 1, 0, false, 0]));

        expect(parser.statuses[0].value).toBe(4294967296);
    });

    it('reads the extra key value pairs', () =>
    {
        const parser = new VariableFxStatusUpdateParser();

        parser.parse(wrapper([false, 1, '19199|hp', false, false, 42, 0, 1, false, 1, 'icon', 'health']));

        expect(parser.statuses[0].extras.get('icon')).toBe('health');
    });
});
