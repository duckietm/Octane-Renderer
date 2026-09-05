import { IFigurePart } from './IFigurePart';

export interface IFigurePartSet
{
    getPart(type: string, id: number): IFigurePart;
    id: number;
    type: string;
    gender: string;
    clubLevel: number;
    isColorable: boolean;
    isSelectable: boolean;
    parts: IFigurePart[];
    hiddenLayers: string[];
    isPreSelectable: boolean;
    isSellable: boolean;
}
