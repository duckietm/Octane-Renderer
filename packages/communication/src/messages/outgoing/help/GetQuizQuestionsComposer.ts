import { IMessageComposer } from '@octane/api';

export class GetQuizQuestionsComposer implements IMessageComposer<ConstructorParameters<typeof GetQuizQuestionsComposer>>
{
    private _data: ConstructorParameters<typeof GetQuizQuestionsComposer>;

    constructor(quizCode: string)
    {
        this._data = [quizCode];
    }

    public getMessageArray()
    {
        return this._data;
    }

    public dispose(): void
    {
        return;
    }
}
