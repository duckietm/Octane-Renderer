import { IEventDispatcher, IOctaneEvent } from '../../../common';
import { IRoomObjectEventHandler } from './IRoomObjectEventHandler';

export interface IRoomObjectLogicFactory
{
    getLogic(type: string): IRoomObjectEventHandler;
    registerEventFunction(func: (event: IOctaneEvent) => void): void;
    removeEventFunction(func: (event: IOctaneEvent) => void): void;
    events: IEventDispatcher;
}
