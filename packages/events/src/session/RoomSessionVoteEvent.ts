import { IRoomSession } from '@octane/api';
import { RoomSessionEvent } from './RoomSessionEvent';


export class RoomSessionVoteEvent extends RoomSessionEvent
{
    public static VOTE_QUESTION: string = 'RSPE_VOTE_QUESTION';
    public static VOTE_RESULT: string = 'RSPE_VOTE_RESULT';

    private _question: string = '';
    private _choices: string[];
    private _SafeStr_7651: string[];
    private _SafeStr_7654: number = 0;

    constructor(type: string, session: IRoomSession, question: string, choices: string[], results: string[] = null, totalVotes: number = 0)
    {
        super(type, session);

        this._choices = [];
        this._SafeStr_7651 = [];
        this._question = question;
        this._choices = choices;
        this._SafeStr_7651 = results;
        if(this._SafeStr_7651 == null)
        {
            this._SafeStr_7651 = [];
        }
        this._SafeStr_7654 = totalVotes;
    }

    public get question(): string
    {
        return this._question;
    }

    public get choices(): string[]
    {
        return this._choices.slice();
    }

    public get _SafeStr_4173(): string[]
    {
        return this._SafeStr_7651.slice();
    }

    public get _SafeStr_4174(): number
    {
        return this._SafeStr_7654;
    }
}
