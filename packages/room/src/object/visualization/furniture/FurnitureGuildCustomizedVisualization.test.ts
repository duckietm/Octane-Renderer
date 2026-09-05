import { IRoomObjectController, RoomObjectVariable } from '@octane/api';
import { describe, expect, it, vi } from 'vitest';
import { FurnitureGuildCustomizedVisualization } from './FurnitureGuildCustomizedVisualization';

const { getGroupBadgeImage, loadGroupBadgeImage } = vi.hoisted(() => ({
    getGroupBadgeImage: vi.fn(),
    loadGroupBadgeImage: vi.fn()
}));

vi.mock('@octane/utils', () => ({
    ChooserSelectionFilter: class
    {},
    TextureUtils: {}
}));

vi.mock('../../../utils', () => ({
    RoomGeometry: class
    {}
}));

vi.mock('@octane/session', () => ({
    GetSessionDataManager: () => ({
        getGroupBadgeImage,
        loadGroupBadgeImage
    })
}));

class TestGuildVisualization extends FurnitureGuildCustomizedVisualization
{
    public updateFromModel(scale: number): boolean
    {
        return this.updateModel(scale);
    }

    protected getLayerTag(scale: number, direction: number, layerId: number): string
    {
        return FurnitureGuildCustomizedVisualization.BADGE;
    }

    public hidesLayer(tag: string): boolean
    {
        return this.shouldHideInvisibleLayer(tag);
    }
}

describe('FurnitureGuildCustomizedVisualization', () =>
{
    it('hides only layers tagged as invisible when preview mode requests it', () =>
    {
        let updateCounter = 1;
        let hideInvisibleLayers = 0;
        const model = {
            get updateCounter(): number
            {
                return updateCounter;
            },
            getValue: <T>(key: string): T =>
            {
                if(key === RoomObjectVariable.FURNITURE_INVISIBLE_LAYER) return hideInvisibleLayers as T;

                return undefined;
            }
        };
        const visualization = new TestGuildVisualization();

        visualization.object = { model } as unknown as IRoomObjectController;
        visualization.updateFromModel(64);

        expect(visualization.hidesLayer('invisible')).toBe(false);

        hideInvisibleLayers = 1;
        updateCounter++;
        visualization.updateFromModel(64);

        expect(visualization.hidesLayer('invisible')).toBe(true);
        expect(visualization.hidesLayer('visible')).toBe(false);
    });

    it('restores the generated badge texture when the furniture asset collection does not contain it', () =>
    {
        const badgeTexture = { label: 'badge_first' };
        const addAsset = vi.fn();
        const model = {
            updateCounter: 1,
            getValue: <T>(key: string): T =>
            {
                if(key === RoomObjectVariable.FURNITURE_GUILD_CUSTOMIZED_ASSET_NAME) return 'badge_first' as T;

                return undefined;
            }
        };
        const visualization = new TestGuildVisualization();

        loadGroupBadgeImage.mockReturnValue('badge_first');
        getGroupBadgeImage.mockReturnValue(badgeTexture);
        visualization.asset = {
            addReference: vi.fn(),
            getAsset: vi.fn().mockReturnValue(null),
            addAsset
        } as never;
        visualization.object = { model } as unknown as IRoomObjectController;

        visualization.updateFromModel(64);

        expect(addAsset).toHaveBeenCalledWith('badge_first', badgeTexture, false);
    });

    it('switches badge assets when the guild badge changes', () =>
    {
        let updateCounter = 1;
        let badgeAssetName = 'badge_first';
        const model = {
            get updateCounter(): number
            {
                return updateCounter;
            },
            getValue: <T>(key: string): T =>
            {
                if(key === RoomObjectVariable.FURNITURE_GUILD_CUSTOMIZED_ASSET_NAME) return badgeAssetName as T;

                return undefined;
            }
        };
        const visualization = new TestGuildVisualization();

        visualization.object = { model } as unknown as IRoomObjectController;
        visualization.updateFromModel(64);

        expect(visualization.getSpriteAssetName(64, 0)).toBe('badge_first');
        expect(visualization.getSpriteAssetName(32, 0)).toBe('badge_first_32');

        badgeAssetName = 'badge_second';
        updateCounter++;
        visualization.updateFromModel(64);

        expect(visualization.getSpriteAssetName(64, 0)).toBe('badge_second');
        expect(visualization.getSpriteAssetName(32, 0)).toBe('badge_second_32');
    });
});
