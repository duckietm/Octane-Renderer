import { IDisposable } from './IDisposable';
import { IEventDispatcher } from './IEventDispatcher';

export interface IOctaneManager extends IDisposable
{
    init(): void;
    events: IEventDispatcher;
    isLoaded: boolean;
    isLoading: boolean;
}
