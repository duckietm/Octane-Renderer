import { IAdvancedMap } from '../../../utils';
import { IFigurePartSet } from './IFigurePartSet';

export interface ISetType
{
    getPartSet(id: number): IFigurePartSet;
    isMandatory(gender: string, clubLevel: number): boolean;
    optionalFromClubLevel(gender: string): number;
    type: string;
    paletteID: number;
    partSets: IAdvancedMap<string, IFigurePartSet>;
}
