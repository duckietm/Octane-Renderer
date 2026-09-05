import { IMessageComposer } from '@octane/api';

export class UpdateFloorPropertiesMessageComposer implements IMessageComposer<ConstructorParameters<typeof UpdateFloorPropertiesMessageComposer>>
{
    private _data: ConstructorParameters<typeof UpdateFloorPropertiesMessageComposer>;

    constructor(model: string, doorX: number, doorY: number, doorDirection: number, thicknessWall: number, thicknessFloor: number, wallHeight: number, autoPickup: boolean = false)
    {
        this._data = [model, doorX, doorY, doorDirection, thicknessWall, thicknessFloor, wallHeight, autoPickup];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
