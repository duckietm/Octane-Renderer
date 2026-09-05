import { RoomObjectVariable } from '@octane/api';
import { FurnitureDynamicThumbnailVisualization } from './FurnitureDynamicThumbnailVisualization';

export class FurnitureYoutubeVisualization extends FurnitureDynamicThumbnailVisualization
{
    protected static THUMBNAIL_URL: string = 'THUMBNAIL_URL';

    constructor()
    {
        super();

        this._hasOutline = false;
    }

    protected getThumbnailURL(): string
    {
        if(!this.object) return null;

        const furnitureData = this.object.model.getValue<{ [index: string]: string }>(RoomObjectVariable.FURNITURE_DATA);

        if(furnitureData) return (furnitureData[FurnitureYoutubeVisualization.THUMBNAIL_URL] || null);

        return null;
    }
}
