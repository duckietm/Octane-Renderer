import { FriendFurniEngravingWidgetType } from '@octane/api';
import { FurnitureFriendFurniLogic } from './FurnitureFriendFurniLogic';

export class FurnitureHweenLovelockLogic extends FurnitureFriendFurniLogic
{
    public get engravingDialogType(): number
    {
        return FriendFurniEngravingWidgetType.HABBOWEEN;
    }
}
