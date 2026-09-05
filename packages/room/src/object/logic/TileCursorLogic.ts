import { IAssetData, RoomObjectVariable } from '@octane/api';
import { ObjectTileCursorUpdateMessage, RoomObjectUpdateMessage } from '../../messages';
import { RoomObjectLogicBase } from './RoomObjectLogicBase';

export class TileCursorLogic extends RoomObjectLogicBase
{
    private static CURSOR_VISIBLE_STATE: number = 0;
    private static CURSOR_HIDDEN_STATE: number = 1;
    private static CURSOR_HEIGHT_STATE: number = 6;

    private _lastEventId: string;
    private _isHidden: boolean;

    private static isMobileTouchDevice(): boolean
    {
        try
        {
            return (typeof window !== 'undefined')
                && window.matchMedia('(pointer: coarse), (hover: none)').matches;
        }
        catch
        {
            return false;
        }
    }

    constructor()
    {
        super();

        this._lastEventId = null;
        this._isHidden = false;
    }

    public initialize(data: IAssetData): void
    {
        if(!this.object) return;

        this.object.model.setValue(RoomObjectVariable.FURNITURE_ALPHA_MULTIPLIER, 1);

        this.object.setState(TileCursorLogic.CURSOR_HIDDEN_STATE, 0);
    }

    public processUpdateMessage(message: RoomObjectUpdateMessage): void
    {
        if(!(message instanceof ObjectTileCursorUpdateMessage)) return;

        if(this._lastEventId && (this._lastEventId === message.sourceEventId)) return;

        if(message.toggleVisibility) this._isHidden = !this._isHidden;

        super.processUpdateMessage(message);

        if(this.object)
        {
            if(this._isHidden || TileCursorLogic.isMobileTouchDevice())
            {
                this.object.setState(TileCursorLogic.CURSOR_HIDDEN_STATE, 0);
            }
            else
            {
                if(!message.visible)
                {
                    this.object.setState(TileCursorLogic.CURSOR_HIDDEN_STATE, 0);
                }
                else
                {
                    this.object.model.setValue(RoomObjectVariable.TILE_CURSOR_HEIGHT, message.height);

                    this.object.setState((message.height > 0.8) ? TileCursorLogic.CURSOR_HEIGHT_STATE : TileCursorLogic.CURSOR_VISIBLE_STATE);
                }
            }
        }

        this._lastEventId = message.sourceEventId;
    }
}
