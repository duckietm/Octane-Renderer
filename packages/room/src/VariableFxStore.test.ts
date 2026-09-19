import { describe, expect, it } from 'vitest';
import { VariableFxStore } from './VariableFxStore';

describe('VariableFxStore', () =>
{
    it('replaces a configuration with the same id', () =>
    {
        const store = new VariableFxStore();

        store.applyConfigs([{ configId: 1, rendererId: 0, categoryId: 1 } as never]);
        store.applyConfigs([{ configId: 1, rendererId: 3, categoryId: 1 } as never]);

        expect(store.getConfig(1).rendererId).toBe(3);
    });

    it('drops the statuses of a removed configuration', () =>
    {
        const store = new VariableFxStore();

        store.applyConfigs([{ configId: 1, rendererId: 0, categoryId: 1 } as never]);
        store.applyStatuses(true, [{ statusKey: '1|score', isUserEntity: false, entityId: 7, value: 5 } as never]);
        store.removeConfigs([1]);

        expect(store.statusesForEntity(false, 7)).toHaveLength(0);
    });

    it('keeps one status per key', () =>
    {
        const store = new VariableFxStore();

        store.applyStatuses(true, [{ statusKey: '1|score', isUserEntity: false, entityId: 7, value: 5 } as never]);
        store.applyStatuses(false, [{ statusKey: '1|score', isUserEntity: false, entityId: 7, value: 9 } as never]);

        expect(store.statusesForEntity(false, 7)).toHaveLength(1);
        expect(store.statusesForEntity(false, 7)[0].value).toBe(9);
    });
});
