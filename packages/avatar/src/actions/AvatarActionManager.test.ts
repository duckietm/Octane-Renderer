import { describe, expect, it } from 'vitest';
import { ActiveActionData } from './ActiveActionData';
import { AvatarActionManager } from './AvatarActionManager';

const LAY = { id: 'Lay', state: 'lay', precedence: 900, main: true, geometryType: 'laying', activePartSet: 'figure', assetPartDefinition: 'lay', prevents: [], animation: false };

const layOffsets = (manager: AvatarActionManager, size: string, direction: number) =>
    manager.getCanvasOffsets([ new ActiveActionData('lay') ], size, direction);

describe('AvatarActionManager lay canvas offsets', () =>
{
    // habbo-avatar-render-lib action_offset_lay.xml, applied by AIR AvatarActionManager.parseActionOffsets.
    it.each([
        [ 'h', 4, [ -17, 17, -0.9 ] ],
        [ 'h', 2, [ 22, 17, -0.9 ] ],
        [ 'sh', 4, [ -5, 16, -0.9 ] ],
        [ 'sh', 2, [ 9, 16, -0.9 ] ]
    ])('uses AIR\'s offset for size %s direction %i when the actions JSON has none', (size, direction, expected) =>
    {
        const manager = new AvatarActionManager(null, { actions: [ LAY ] });

        expect(layOffsets(manager, size as string, direction as number)).toEqual(expected);
    });

    it('keeps offsets the actions JSON brings', () =>
    {
        const manager = new AvatarActionManager(null, {
            actions: [ LAY ],
            actionOffsets: [ { action: 'lay', offsets: [ { size: 'h', direction: 2, x: 1, y: 2, z: 3 } ] } ]
        });

        expect(layOffsets(manager, 'h', 2)).toEqual([ 1, 2, 3 ]);
        expect(layOffsets(manager, 'h', 4)).toEqual([ -17, 17, -0.9 ]);
    });

    // habbo-avatar-render-lib action_offset_swim.xml: size sh only.
    it.each([ [ 0, [ -28, 0, 0 ] ], [ 3, [ -28, 0, 0 ] ], [ 4, [ 0, 0, 0 ] ], [ 7, [ -28, 0, 0 ] ] ])('uses AIR\'s swim offset for size sh direction %i', (direction, expected) =>
    {
        const SWIM = { id: 'Swim', state: 'swim', precedence: 900, main: true, geometryType: 'swhorizontal', activePartSet: 'swim', assetPartDefinition: 'swim', prevents: [], animation: true };
        const manager = new AvatarActionManager(null, { actions: [ SWIM ] });

        expect(manager.getCanvasOffsets([ new ActiveActionData('swim') ], 'sh', direction as number)).toEqual(expected);
        expect(manager.getCanvasOffsets([ new ActiveActionData('swim') ], 'h', direction as number)).toEqual([]);
    });

    it('gives other postures no offset', () =>
    {
        const manager = new AvatarActionManager(null, { actions: [ LAY, { id: 'Default', state: 'std', precedence: 1000, main: true, isDefault: true, geometryType: 'vertical', activePartSet: 'figure', assetPartDefinition: 'std', prevents: [] } ] });

        expect(manager.getCanvasOffsets([ new ActiveActionData('std') ], 'h', 2)).toEqual([]);
    });
});
