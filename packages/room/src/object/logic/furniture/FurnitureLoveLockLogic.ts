import { FriendFurniEngravingWidgetType } from '@octane/api';
import { FurnitureFriendFurniLogic } from './FurnitureFriendFurniLogic';

export class FurnitureLoveLockLogic extends FurnitureFriendFurniLogic
{
    public get engravingDialogType(): number
    {
        return FriendFurniEngravingWidgetType.LOVE_LOCK;
    }
}
