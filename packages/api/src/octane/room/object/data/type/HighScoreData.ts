export class HighScoreData
{
    private _score: number;
    private _users: string[];

    constructor()
    {
        this._score = -1;
        this._users = [];
    }

    public get score(): number
    {
        return this._score;
    }

    public set score(value: number)
    {
        this._score = value;
    }

    public get users(): string[]
    {
        return this._users;
    }

    public set users(value: string[])
    {
        this._users = value;
    }

    public addUsername(username: string): void
    {
        this._users.push(username);
    }
}