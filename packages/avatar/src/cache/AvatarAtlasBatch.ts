// Ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).
import { BLEND_MODES, ExtensionType, extensions, InstructionSet, Matrix, Renderer, Texture, ViewContainer } from 'pixi.js';

// A textured quad in Pixi's default batch, without a Sprite (or any scene graph) around it.
// The batcher reads these fields; DefaultBatcher.packQuadAttributes draws `bounds` through `transform`.
export class AvatarAtlasQuad
{
    public readonly batcherName: string = 'default';
    public readonly topology: string = 'triangle-list';
    public readonly attributeSize: number = 4;
    public readonly indexSize: number = 6;
    public readonly packAsQuad: boolean = true;
    public roundPixels: 0 | 1 = 0;
    public texture: Texture = null;
    public readonly transform: Matrix = new Matrix();
    public readonly bounds = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    public color: number = 0xFFFFFFFF;
    public blendMode: BLEND_MODES = 'normal';

    public _indexStart: number = 0;
    public _attributeStart: number = 0;
    public _textureId: number = 0;
    public _batcher: unknown = null;
    public _batch: unknown = null;

    // Same quad as a Sprite with this texture, anchor 0, an optional horizontal flip and a tint.
    public set(texture: Texture, x: number, y: number, flipped: boolean, tint: number): void
    {
        const trim = texture.trim;
        const bounds = this.bounds;

        if(trim)
        {
            bounds.minX = trim.x;
            bounds.maxX = (trim.x + trim.width);
            bounds.minY = trim.y;
            bounds.maxY = (trim.y + trim.height);
        }
        else
        {
            bounds.minX = 0;
            bounds.maxX = texture.orig.width;
            bounds.minY = 0;
            bounds.maxY = texture.orig.height;
        }

        this.texture = texture;
        this.transform.set((flipped ? -1 : 1), 0, 0, 1, x, y);
        // Tints are RGB; the batch wants alpha and BGR.
        this.color = (((0xFF << 24) | ((tint & 0xFF) << 16) | (tint & 0xFF00) | ((tint >> 16) & 0xFF)) >>> 0);
        this.blendMode = 'normal';
    }

    // Clears a rectangle: a white quad drawn with the erase blend.
    public setEraser(x: number, y: number, width: number, height: number): void
    {
        const bounds = this.bounds;

        bounds.minX = 0;
        bounds.maxX = 1;
        bounds.minY = 0;
        bounds.maxY = 1;

        this.texture = Texture.WHITE;
        this.transform.set(width, 0, 0, height, x, y);
        this.color = 0xFFFFFFFF;
        this.blendMode = 'erase';
    }

    public reset(): void
    {
        this.texture = null;
        this._batcher = null;
        this._batch = null;
    }
}

// Every quad of one atlas flush, handed to the batcher in order.
export class AvatarAtlasBatch extends ViewContainer
{
    public static readonly PIPE_ID: string = 'avatarAtlasBatch';

    public override readonly renderPipeId: string = AvatarAtlasBatch.PIPE_ID;
    public readonly batched: boolean = true;
    public quads: AvatarAtlasQuad[] = [];
    public count: number = 0;

    constructor()
    {
        super({});

        this.allowChildren = false;
    }

    public setQuads(quads: AvatarAtlasQuad[], count: number): void
    {
        this.quads = quads;
        this.count = count;
        this.onViewUpdate();
    }

    protected override updateBounds(): void
    {
        // Never culled or measured; it always covers the page it draws into.
        const bounds = this._bounds;

        bounds.minX = 0;
        bounds.minY = 0;
        bounds.maxX = 1;
        bounds.maxY = 1;
    }
}

type BatchPipe = { addToBatch(element: unknown, instructionSet: InstructionSet): void };

export class AvatarAtlasBatchPipe
{
    public static extension = {
        type: [ExtensionType.WebGLPipes, ExtensionType.WebGPUPipes],
        name: AvatarAtlasBatch.PIPE_ID
    } as const;

    constructor(private _renderer: Renderer)
    {}

    public addRenderable(batch: AvatarAtlasBatch, instructionSet: InstructionSet): void
    {
        const pipe = (this._renderer.renderPipes as unknown as { batch: BatchPipe }).batch;
        const quads = batch.quads;

        for(let index = 0; index < batch.count; index++) pipe.addToBatch(quads[index], instructionSet);
    }

    public updateRenderable(batch: AvatarAtlasBatch): void
    {
        // The quad list changes with every flush; validateRenderable asks for a rebuild instead.
    }

    // Any change to the batch is a new list of quads, so the instructions are always rebuilt.
    public validateRenderable(batch: AvatarAtlasBatch): boolean
    {
        return true;
    }

    public destroy(): void
    {
        this._renderer = null;
    }
}

extensions.add(AvatarAtlasBatchPipe);

// A renderer created before this module loaded did not pick the pipe up from the extensions.
export const EnsureAvatarAtlasBatchPipe = (renderer: Renderer): void =>
{
    const pipes = renderer.renderPipes as unknown as Record<string, unknown>;

    if(!pipes[AvatarAtlasBatch.PIPE_ID]) pipes[AvatarAtlasBatch.PIPE_ID] = new AvatarAtlasBatchPipe(renderer);
};
