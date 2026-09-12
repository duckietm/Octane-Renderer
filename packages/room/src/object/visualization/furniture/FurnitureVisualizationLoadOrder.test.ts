// The FurnitureVisualization import below must stay this file's FIRST module import: the whole
// point of the test is that the furniture and pet visualization cluster still evaluates in a
// valid order when it is entered here, instead of through one of the concrete subclasses that
// happen to pull the rest of the cluster in first.
//
// The cycle this guards against closes through the room utils barrel: importing
// `../../../utils` (rather than `../../../utils/RoomGeometry`) from FurnitureVisualizationData
// or FurnitureAnimatedVisualizationData pulls in utils/index, which re-exports
// RoomAreaSelectionManager, which imports the `../object` barrel, which re-exports
// furniture/index - whose first export is FurnitureAnimatedVisualization. That re-entry happens
// while FurnitureVisualizationData is still evaluating, so the `extends` clauses below resolve
// to undefined and the module graph throws before any test runs.
import { FurnitureVisualization } from './FurnitureVisualization';
import { describe, expect, it } from 'vitest';
import { PetVisualization } from '../pet/PetVisualization';
import { PetVisualizationData } from '../pet/PetVisualizationData';
import { FurnitureAnimatedVisualization } from './FurnitureAnimatedVisualization';
import { FurnitureAnimatedVisualizationData } from './FurnitureAnimatedVisualizationData';
import { FurnitureVisualizationData } from './FurnitureVisualizationData';

describe('furniture and pet visualization load order', () =>
{
    it('resolves the whole subclass chain when FurnitureVisualization is the entry module', () =>
    {
        expect(typeof FurnitureVisualization).toBe('function');
        expect(FurnitureAnimatedVisualization.prototype).toBeInstanceOf(FurnitureVisualization);
        expect(FurnitureAnimatedVisualizationData.prototype).toBeInstanceOf(FurnitureVisualizationData);
        expect(PetVisualization.prototype).toBeInstanceOf(FurnitureAnimatedVisualization);
        expect(PetVisualizationData.prototype).toBeInstanceOf(FurnitureAnimatedVisualizationData);
    });
});
