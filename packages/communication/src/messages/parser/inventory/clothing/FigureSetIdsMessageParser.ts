import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class FigureSetIdsMessageParser implements IMessageParser
{
    private _figureSetIds: number[];
    private _boundFurnitureNames: string[];
    private _figureSetNameMap: { [index: number]: string };

    public flush(): boolean
    {
        this._figureSetIds = [];
        this._boundFurnitureNames = [];
        this._figureSetNameMap = {};

        return true;
    }

    public parse(wrapper: IMessageDataWrapper): boolean
    {
        if(!wrapper) return false;

        let totalSetIds = wrapper.readInt();

        while(totalSetIds > 0)
        {
            this._figureSetIds.push(wrapper.readInt());

            totalSetIds--;
        }

        let totalFurnitureNames = wrapper.readInt();

        while(totalFurnitureNames > 0)
        {
            this._boundFurnitureNames.push(wrapper.readString());

            totalFurnitureNames--;
        }

        if(wrapper.bytesAvailable)
        {
            let totalMappings = wrapper.readInt();

            while(totalMappings > 0)
            {
                const furnitureName = wrapper.readString();
                let totalMappedSetIds = wrapper.readInt();

                while(totalMappedSetIds > 0)
                {
                    this._figureSetNameMap[wrapper.readInt()] = furnitureName;

                    totalMappedSetIds--;
                }

                totalMappings--;
            }
        }

        return true;
    }

    public get figureSetIds(): number[]
    {
        return this._figureSetIds;
    }

    public get boundsFurnitureNames(): string[]
    {
        return this._boundFurnitureNames;
    }

    public get figureSetNameMap(): { [index: number]: string }
    {
        return this._figureSetNameMap;
    }
}
