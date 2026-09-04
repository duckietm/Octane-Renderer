import { IMessageComposer } from '@nitrots/api';
import { IHotelViewLandingScene } from '../../parser';

export class HotelViewLandingSaveSceneComposer implements IMessageComposer<(string | number | boolean)[]>
{
    private _data: (string | number | boolean)[];

    constructor(scene: IHotelViewLandingScene)
    {
        this._data = [
            scene.backgroundUrl,
            scene.leftUrl,
            scene.rightUrl,
            scene.drapeUrl,
            scene.leftX,
            scene.leftY,
            scene.rightX,
            scene.rightY,
            scene.drapeX,
            scene.drapeY,
            scene.hallOfFameX,
            scene.hallOfFameY,
            scene.hallOfFameEnabled,
            scene.hallOfFameMode,
            scene.hallOfFameCurrencyType
        ];
    }

    public getMessageArray(): (string | number | boolean)[]
    {
        return this._data;
    }
    public dispose(): void
    {
        return;
    }
}
