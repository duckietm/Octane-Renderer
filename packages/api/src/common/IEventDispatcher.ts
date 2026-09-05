import { IOctaneEvent } from './IOctaneEvent';

export interface IEventDispatcher
{
    dispose(): void;
    addEventListener<T extends IOctaneEvent>(type: string, callback: (event: T) => void): void;
    removeEventListener(type: string, callback: Function): void;
    removeAllListeners(): void;
    dispatchEvent<T extends IOctaneEvent>(event: T): boolean;
    subscribe<T extends IOctaneEvent>(type: string | string[], callback: (event: T) => void): () => void;
}
