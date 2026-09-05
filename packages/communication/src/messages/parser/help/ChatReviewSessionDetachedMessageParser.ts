import { IMessageDataWrapper, IMessageParser } from '@octane/api';

export class ChatReviewSessionDetachedMessageParser implements IMessageParser
{
    flush(): boolean
    {
        return true;
    }

    parse(wrapper: IMessageDataWrapper): boolean
    {
        return true;
    }

}
