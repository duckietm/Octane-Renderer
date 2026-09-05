import { IOctaneEvent } from '../../../common';

export interface IRoomAreaSelectionManager
{
    startSelecting(): void;
    clearHighlight(): void;
    handleTileMouseEvent(event: IOctaneEvent): void;
    finishSelecting(): boolean;
    activate(callback: (rootX: number, rootY: number, width: number, height: number) => void, highlightType: string): boolean;
    deactivate(): void;
    setHighlight(rootX: number, rootY: number, width: number, height: number): void;
    setHighlightType(highlightType: string): void;
    readonly areaSelectionState: number;
}
