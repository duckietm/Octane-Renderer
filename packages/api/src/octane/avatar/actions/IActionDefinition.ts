export interface IActionDefinition
{
    id: string;
    state: string;
    precedence: number;
    activePartSet: string;
    isMain: boolean;
    isDefault: boolean;
    assetPartDefinition: string;
    lay: string;
    geometryType: string;
    isAnimation: boolean;
    startFromFrameZero: boolean;
    isAnimated(state: string): boolean;
    getPrevents(state: string): string[];
    getPreventHeadTurn(state: string): boolean;
    setOffsets(state: string, direction: number, offsets: []): void;
    getOffsets(state: string, direction: number): number[];
}
