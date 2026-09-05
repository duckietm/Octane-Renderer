import { IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';

export class RoomSessionQueueEvent extends RoomSessionEvent
{
    public static QUEUE_STATUS: string = 'RSQE_QUEUE_STATUS';
    public static QUEUE_TYPE_CLUB: string = 'c';
    public static QUEUE_TYPE_NORMAL: string = 'd';
    public static QUEUE_TARGET_VISITOR: number = 2;
    public static QUEUE_TARGET_SPECTATOR: number = 1;

    private _name: string;
    private _target: number;
    private _queues: Map<string, number>;
    private _isActive: boolean;
    private _activeQueue: string;

    constructor(session: IRoomSession, name: string, target: number, isActive: boolean = false)
    {
        super(RoomSessionQueueEvent.QUEUE_STATUS, session);

        this._name = name;
        this._target = target;
        this._queues = new Map();
        this._isActive = isActive;
    }

    public get isActive(): boolean
    {
        return this._isActive;
    }

    public get queueSetName(): string
    {
        return this._name;
    }

    public get queueSetTarget(): number
    {
        return this._target;
    }

    public get queueTypes(): string[]
    {
        return Array.from(this._queues.keys());
    }

    public getQueueSize(queueType: string): number
    {
        return this._queues.get(queueType);
    }

    public addQueue(queueType: string, size: number): void
    {
        this._queues.set(queueType, size);
    }
}
