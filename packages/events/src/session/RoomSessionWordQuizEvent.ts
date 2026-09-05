import { IQuestion, IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';

export class RoomSessionWordQuizEvent extends RoomSessionEvent
{
    public static QUESTION: string = 'RWPUW_NEW_QUESTION';
    public static FINISHED: string = 'RWPUW_QUESION_FINSIHED';
    public static ANSWERED: string = 'RWPUW_QUESTION_ANSWERED';

    private _id: number = -1;
    private _pollType: string = null;
    private _pollId: number = -1;
    private _questionId: number = -1;
    private _duration: number = -1;
    private _question: IQuestion = null;
    private _userId: number = -1;
    private _value: string;
    private _answerCounts: Map<string, number>;

    constructor(type: string, session: IRoomSession, id: number = -1)
    {
        super(type, session);

        this._id = id;
    }

    public get id(): number
    {
        return this._id;
    }

    public get pollType(): string
    {
        return this._pollType;
    }

    public set pollType(pollType: string)
    {
        this._pollType = pollType;
    }

    public get pollId(): number
    {
        return this._pollId;
    }

    public set pollId(value: number)
    {
        this._pollId = value;
    }

    public get questionId(): number
    {
        return this._questionId;
    }

    public set questionId(value: number)
    {
        this._questionId = value;
    }

    public get duration(): number
    {
        return this._duration;
    }

    public set duration(value: number)
    {
        this._duration = value;
    }

    public get question(): IQuestion
    {
        return this._question;
    }

    public set question(value: IQuestion)
    {
        this._question = value;
    }

    public get userId(): number
    {
        return this._userId;
    }

    public set userId(value: number)
    {
        this._userId = value;
    }

    public get value(): string
    {
        return this._value;
    }

    public set value(value: string)
    {
        this._value = value;
    }

    public get answerCounts(): Map<string, number>
    {
        return this._answerCounts;
    }

    public set answerCounts(value: Map<string, number>)
    {
        this._answerCounts = value;
    }
}
