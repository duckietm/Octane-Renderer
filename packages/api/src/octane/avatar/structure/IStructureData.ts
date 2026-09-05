import { IFigurePartSet } from './IFigurePartSet';
import { IPalette } from './IPalette';
import { ISetType } from './ISetType';

export interface IStructureData
{
    parse(data: any): boolean;
    appendJSON(data: any): boolean;
    getSetType(type: string): ISetType;
    getPalette(paletteId: number): IPalette;
    getFigurePartSet(id: number): IFigurePartSet;
}
