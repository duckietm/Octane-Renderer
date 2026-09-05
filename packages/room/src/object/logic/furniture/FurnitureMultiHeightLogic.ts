import { IAssetData, RoomObjectVariable } from '@octane/api';
import { RoomObjectStateChangedEvent } from '@octane/events';
import { FurnitureMultiStateLogic } from './FurnitureMultiStateLogic';

export class FurnitureMultiHeightLogic extends FurnitureMultiStateLogic
{
    public initialize(asset: IAssetData): void
    {
        super.initialize(asset);

        if(this.object && this.object.model) this.object.model.setValue(RoomObjectVariable.FURNITURE_IS_VARIABLE_HEIGHT, 1);
    }

    public useObject(): void
    {
        if(!this.object || !this.eventDispatcher) return;
        this.eventDispatcher.dispatchEvent(new RoomObjectStateChangedEvent(RoomObjectStateChangedEvent.STATE_CHANGE, this.object));
    }
}
