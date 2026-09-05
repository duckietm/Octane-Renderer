import { IAssetData, RoomObjectVariable } from '@octane/api';
import { RoomObjectFurnitureActionEvent, RoomObjectWidgetRequestEvent } from '@octane/events';
import { ObjectItemDataUpdateMessage, RoomObjectUpdateMessage } from '../../../messages';
import { FurnitureLogic } from './FurnitureLogic';

export class FurnitureStickieLogic extends FurnitureLogic
{
    private static STICKIE_COLORS: string[] = ['FF9C9C', 'FFC69C', 'FFFF33', '9CFF9C', '9CFFE8', '9CCEFF', 'C69CFF', 'FF9CFF'];
    private static DEFAULT_STICKIE_COLOR: string = 'FFFF33';
    private static LEGACY_STICKIE_COLORS: string[] = ['9CCEFF', 'FF9CFF', '9CFF9C', 'FFFF33'];

    public getEventTypes(): string[]
    {
        const types = [
            RoomObjectWidgetRequestEvent.STICKIE,
            RoomObjectFurnitureActionEvent.STICKIE
        ];

        return this.mergeTypes(super.getEventTypes(), types);
    }

    public initialize(asset: IAssetData): void
    {
        super.initialize(asset);

        this.updateColor();

        if(this.object) this.object.model.setValue(RoomObjectVariable.FURNITURE_IS_STICKIE, '');
    }

    public processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        super.processUpdateMessage(message);

        if(message instanceof ObjectItemDataUpdateMessage)
        {
            this.eventDispatcher && this.eventDispatcher.dispatchEvent(new RoomObjectWidgetRequestEvent(RoomObjectWidgetRequestEvent.STICKIE, this.object));
        }

        this.updateColor();
    }

    protected updateColor(): void
    {
        if(!this.object) return;

        const furnitureData = this.object.model.getValue<string>(RoomObjectVariable.FURNITURE_DATA);

        if(this.object.type === 'post_it')
        {
            let color = furnitureData;

            if(FurnitureStickieLogic.STICKIE_COLORS.indexOf(color) === -1) color = FurnitureStickieLogic.DEFAULT_STICKIE_COLOR;

            this.object.model.setValue(RoomObjectVariable.FURNITURE_COLOR, parseInt(color, 16));

            return;
        }

        let colorIndex = FurnitureStickieLogic.LEGACY_STICKIE_COLORS.indexOf(furnitureData);

        if(colorIndex < 0) colorIndex = 3;

        this.object.model.setValue(RoomObjectVariable.FURNITURE_COLOR, (colorIndex + 1));
    }

    public useObject(): void
    {
        if(!this.object || !this.eventDispatcher) return;

        this.eventDispatcher.dispatchEvent(new RoomObjectFurnitureActionEvent(RoomObjectFurnitureActionEvent.STICKIE, this.object));
    }
}
