import { describe, expect, it, vi } from 'vitest';
import { EventDispatcher } from '../EventDispatcher';

describe('EventDispatcher', () =>
{
    it('does not call a listener that an earlier listener removed in the same dispatch', () =>
    {
        const dispatcher = new EventDispatcher();
        const second = vi.fn();
        const first = vi.fn(() => dispatcher.removeEventListener('TEST', second));

        dispatcher.addEventListener('TEST', first);
        dispatcher.addEventListener('TEST', second);
        dispatcher.dispatchEvent({ type: 'TEST' } as never);

        expect(first).toHaveBeenCalledTimes(1);
        expect(second).not.toHaveBeenCalled();
    });

    it('still calls every listener that stays', () =>
    {
        const dispatcher = new EventDispatcher();
        const a = vi.fn();
        const b = vi.fn();

        dispatcher.addEventListener('TEST', a);
        dispatcher.addEventListener('TEST', b);
        dispatcher.dispatchEvent({ type: 'TEST' } as never);

        expect(a).toHaveBeenCalledTimes(1);
        expect(b).toHaveBeenCalledTimes(1);
    });
});
