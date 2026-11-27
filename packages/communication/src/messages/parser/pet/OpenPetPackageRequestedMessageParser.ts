import { IMessageDataWrapper, IMessageParser, PetFigureData } from '@octane/api';

// Ported from plus-emulator/volt-renderer 0b24bed3 (by Dennis, GPL-3.0): the pet figure as the official client reads it.
export class OpenPetPackageRequestedMessageParser implements IMessageParser
{
    private _objectId: number;
    private _figureData: PetFigureData;

    flush(): boolean
    {
        this._objectId = -1;
        this._figureData = null;

        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        this._objectId = wrapper.readInt();

        if(!wrapper.bytesAvailable) return true;

        this._figureData = new PetFigureData(this.readFigure(wrapper));

        return true;
    }

    // The official client reads the pet as type, palette, colour, an unused int and the counted custom parts, and
    // builds the figure string from them.
    private readFigure(wrapper: IMessageDataWrapper): string
    {
        const typeId = wrapper.readInt();
        const paletteId = wrapper.readInt();
        const color = wrapper.readString();
        wrapper.readInt();
        const parts: number[] = [];
        const count = wrapper.readInt();

        for(let i = 0; i < count; i++)
        {
            parts.push(wrapper.readInt(), wrapper.readInt(), wrapper.readInt());
        }

        return [typeId, paletteId, color, count, ...parts].join(' ');
    }

    public get objectId(): number
    {
        return this._objectId;
    }

    public get figureData(): PetFigureData
    {
        return this._figureData;
    }
}
