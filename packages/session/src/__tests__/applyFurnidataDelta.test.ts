import { describe, expect, it, vi, beforeEach } from 'vitest';
import { applyFurnidataDeltaTo } from '../furniture/applyFurnidataDelta';

describe('applyFurnidataDeltaTo', () =>
{
    const setValue = vi.fn();
    beforeEach(() => setValue.mockClear());

    it('patches floor FurnitureData name/desc + localization keys, dispatches window event', () =>
    {
        const floor: any = { _localizedName: 'Old', _description: 'Old desc' };
        const floorItems = new Map<number, any>([[ 5, floor ]]);
        const dispatched: string[] = [];
        const win: any = { dispatchEvent: (e: any) => dispatched.push(e.type) };

        applyFurnidataDeltaTo(
            [ { type: 'S', id: 5, classname: 'chair', name: 'New', description: 'New desc' } ],
            floorItems, new Map(), { setValue }, win
        );

        expect(floor._localizedName).toBe('New');
        expect(floor._description).toBe('New desc');
        expect(setValue).toHaveBeenCalledWith('roomItem.name.5', 'New');
        expect(setValue).toHaveBeenCalledWith('roomItem.desc.5', 'New desc');
        expect(dispatched).toContain('octane-localization-updated');
    });

    it('patches wall items by id', () =>
    {
        const wall: any = { _localizedName: 'W', _description: '' };
        const wallItems = new Map<number, any>([[ 9, wall ]]);
        applyFurnidataDeltaTo(
            [ { type: 'I', id: 9, classname: 'poster', name: 'WallNew', description: 'd' } ],
            new Map(), wallItems, { setValue }, { dispatchEvent: () =>
            {} }
        );
        expect(wall._localizedName).toBe('WallNew');
        expect(setValue).toHaveBeenCalledWith('wallItem.name.9', 'WallNew');
    });
});
