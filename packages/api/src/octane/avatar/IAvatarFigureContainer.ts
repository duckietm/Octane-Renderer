export interface IAvatarFigureContainer
{
    getPartTypeIds(): IterableIterator<string>;
    hasPartType(type: string): boolean;
    getPartSetId(type: string): number;
    getPartColorIds(type: string): number[];
    updatePart(type: string, partSetId: number, colorIds: number[]): void;
    removePart(type: string): void;
    getFigureString(): string;
}
