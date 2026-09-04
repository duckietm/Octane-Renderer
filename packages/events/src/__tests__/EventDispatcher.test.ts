import { describe, it, expect, beforeEach, vi } from 'vitest';
import { EventDispatcher } from '../EventDispatcher';

interface TestEvent
{
    type: string;
    data?: any;
}

describe('EventDispatcher', () =>
{
    let dispatcher: EventDispatcher;

    beforeEach(() =>
    {
        dispatcher = new EventDispatcher();
    });

    describe('addEventListener', () =>
    {
        it('should add event listener', () =>
        {
            const callback = vi.fn();
            dispatcher.addEventListener('test', callback);

            dispatcher.dispatchEvent({ type: 'test' });

            expect(callback).toHaveBeenCalledTimes(1);
        });

        it('should support multiple listeners for same event', () =>
        {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            dispatcher.addEventListener('test', callback1);
            dispatcher.addEventListener('test', callback2);

            dispatcher.dispatchEvent({ type: 'test' });

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should not add listener if type is null', () =>
        {
            const callback = vi.fn();
            dispatcher.addEventListener(null, callback);

            // Should not throw and callback should never be called
            expect(() => dispatcher.dispatchEvent({ type: 'test' })).not.toThrow();
        });

        it('should not add listener if callback is null', () =>
        {
            dispatcher.addEventListener('test', null);

            // Should not throw
            expect(() => dispatcher.dispatchEvent({ type: 'test' })).not.toThrow();
        });
    });

    describe('removeEventListener', () =>
    {
        it('should remove event listener', () =>
        {
            const callback = vi.fn();
            dispatcher.addEventListener('test', callback);
            dispatcher.removeEventListener('test', callback);

            dispatcher.dispatchEvent({ type: 'test' });

            expect(callback).not.toHaveBeenCalled();
        });

        it('should only remove specified listener', () =>
        {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            dispatcher.addEventListener('test', callback1);
            dispatcher.addEventListener('test', callback2);
            dispatcher.removeEventListener('test', callback1);

            dispatcher.dispatchEvent({ type: 'test' });

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).toHaveBeenCalledTimes(1);
        });

        it('should handle removing non-existent listener', () =>
        {
            const callback = vi.fn();

            // Should not throw
            expect(() => dispatcher.removeEventListener('test', callback)).not.toThrow();
        });

        it('should not remove listener if type is null', () =>
        {
            const callback = vi.fn();
            dispatcher.addEventListener('test', callback);
            dispatcher.removeEventListener(null, callback);

            dispatcher.dispatchEvent({ type: 'test' });

            expect(callback).toHaveBeenCalledTimes(1);
        });
    });

    describe('dispatchEvent', () =>
    {
        it('should dispatch event to listeners', () =>
        {
            const callback = vi.fn();
            dispatcher.addEventListener('test', callback);

            const event: TestEvent = { type: 'test', data: 'hello' };
            dispatcher.dispatchEvent(event);

            expect(callback).toHaveBeenCalledWith(event);
        });

        it('should return true when event is dispatched', () =>
        {
            const result = dispatcher.dispatchEvent({ type: 'test' });
            expect(result).toBe(true);
        });

        it('should return false when event is null', () =>
        {
            const result = dispatcher.dispatchEvent(null as any);
            expect(result).toBe(false);
        });

        it('should not throw when no listeners for event type', () =>
        {
            expect(() => dispatcher.dispatchEvent({ type: 'unknown' })).not.toThrow();
        });

        it('should call listeners in order they were added', () =>
        {
            const order: number[] = [];

            dispatcher.addEventListener('test', () => order.push(1));
            dispatcher.addEventListener('test', () => order.push(2));
            dispatcher.addEventListener('test', () => order.push(3));

            dispatcher.dispatchEvent({ type: 'test' });

            expect(order).toEqual([1, 2, 3]);
        });

        it('should handle errors in listeners gracefully', () =>
        {
            const callback1 = vi.fn(() =>
            {
                throw new Error('Test error');
            });
            const callback2 = vi.fn();

            dispatcher.addEventListener('test', callback1);
            dispatcher.addEventListener('test', callback2);

            // Should not throw
            expect(() => dispatcher.dispatchEvent({ type: 'test' })).not.toThrow();

            // First callback was called
            expect(callback1).toHaveBeenCalled();

            // Second callback was NOT called because first threw error
            // (This is the current behavior - stops on first error)
            expect(callback2).not.toHaveBeenCalled();
        });
    });

    describe('removeAllListeners', () =>
    {
        it('should remove all listeners', () =>
        {
            const callback1 = vi.fn();
            const callback2 = vi.fn();
            const callback3 = vi.fn();

            dispatcher.addEventListener('test1', callback1);
            dispatcher.addEventListener('test2', callback2);
            dispatcher.addEventListener('test1', callback3);

            dispatcher.removeAllListeners();

            dispatcher.dispatchEvent({ type: 'test1' });
            dispatcher.dispatchEvent({ type: 'test2' });

            expect(callback1).not.toHaveBeenCalled();
            expect(callback2).not.toHaveBeenCalled();
            expect(callback3).not.toHaveBeenCalled();
        });
    });

    describe('dispose', () =>
    {
        it('should remove all listeners on dispose', () =>
        {
            const callback = vi.fn();
            dispatcher.addEventListener('test', callback);

            dispatcher.dispose();

            dispatcher.dispatchEvent({ type: 'test' });

            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('multiple event types', () =>
    {
        it('should handle multiple event types independently', () =>
        {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            dispatcher.addEventListener('type1', callback1);
            dispatcher.addEventListener('type2', callback2);

            dispatcher.dispatchEvent({ type: 'type1' });

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).not.toHaveBeenCalled();

            dispatcher.dispatchEvent({ type: 'type2' });

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
        });
    });

    describe('event data', () =>
    {
        it('should pass event data to listeners', () =>
        {
            const callback = vi.fn();
            dispatcher.addEventListener('test', callback);

            const eventData = { type: 'test', value: 42, nested: { key: 'value' } };
            dispatcher.dispatchEvent(eventData);

            expect(callback).toHaveBeenCalledWith(eventData);
        });
    });
});
