import { IPollQuestion, IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';

export class RoomSessionPollEvent extends RoomSessionEvent
{
    public static OFFER: string = 'RSPE_POLL_OFFER';
    public static ERROR: string = 'RSPE_POLL_ERROR';
    public static CONTENT: string = 'RSPE_POLL_CONTENT';

    private _id: number = -1;
    private _headline: string;
    private _summary: string;
    private _numQuestions: number = 0;
    private _startMessage: string = '';
    private _endMessage: string = '';
    private _questionArray: IPollQuestion[] = null;
    private _npsPoll: boolean = false;

    constructor(type: string, session: IRoomSession, id: number)
    {
        super(type, session);

        this._id = id;
    }

    public get id(): number
    {
        return this._id;
    }

    public get headline(): string
    {
        return this._headline;
    }

    public set headline(value: string)
    {
        this._headline = value;
    }

    public get summary(): string
    {
        return this._summary;
    }

    public set summary(value: string)
    {
        this._summary = value;
    }

    public get numQuestions(): number
    {
        return this._numQuestions;
    }

    public set numQuestions(value: number)
    {
        this._numQuestions = value;
    }

    public get startMessage(): string
    {
        return this._startMessage;
    }

    public set startMessage(value: string)
    {
        this._startMessage = value;
    }

    public get endMessage(): string
    {
        return this._endMessage;
    }

    public set endMessage(value: string)
    {
        this._endMessage = value;
    }

    public get questionArray(): IPollQuestion[]
    {
        return this._questionArray;
    }

    public set questionArray(value: IPollQuestion[])
    {
        this._questionArray = value;
    }

    public get npsPoll(): boolean
    {
        return this._npsPoll;
    }

    public set npsPoll(value: boolean)
    {
        this._npsPoll = value;
    }
}
