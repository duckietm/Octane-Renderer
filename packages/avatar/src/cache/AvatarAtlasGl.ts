// Ported from plus-emulator/volt-renderer (by Dennis, GPL-3.0).
import { Renderer, Texture, TextureSource, WebGLRenderer } from 'pixi.js';
import { AvatarLayerQuad, AvatarPartLayer } from '../AvatarImageBodyPartContainer';

const MAX_UNITS = 16;
const FLOATS_PER_VERTEX = 6;
const BYTES_PER_VERTEX = (FLOATS_PER_VERTEX * 4);
const MAX_QUADS = 8192;

const VERTEX = `#version 300 es
in vec2 aPosition;
in vec2 aUV;
in vec4 aColor;
in float aTexture;
uniform vec2 uSize;
out vec2 vUV;
out vec4 vColor;
flat out int vTexture;
flat out int vUnpremultiplied;
void main()
{
    // Render textures keep the top row first, like Pixi's own render texture projection.
    gl_Position = vec4((aPosition / uSize) * 2.0 - 1.0, 0.0, 1.0);
    vUV = aUV;
    vColor = vec4(aColor.rgb * aColor.a, aColor.a);
    int texture = int(aTexture + 0.5);
    vTexture = texture & 31;
    vUnpremultiplied = texture >> 5;
}`;

const sampleChain = (): string =>
{
    let chain = '';

    for(let unit = 0; unit < MAX_UNITS; unit++) chain += `${ unit ? 'else ' : '' }if(vTexture == ${ unit }) color = texture(uTextures[${ unit }], vUV);\n    `;

    return chain;
};

const FRAGMENT = `#version 300 es
precision highp float;
uniform sampler2D uTextures[${ MAX_UNITS }];
in vec2 vUV;
in vec4 vColor;
flat in int vTexture;
flat in int vUnpremultiplied;
out vec4 fragColor;
void main()
{
    // Unit 31 is an erase quad: blending is off for it, so it writes transparent black.
    if(vTexture == 31) { fragColor = vec4(0.0); return; }
    vec4 color = vec4(0.0);
    ${ sampleChain() }
    // Pixi blends straight-alpha sources with normal-npm; premultiplying here gives the same result.
    if(vUnpremultiplied == 1) color.rgb *= color.a;
    fragColor = color * vColor;
}`;

/**
 * Draws atlas cells straight with WebGL2: one buffer upload and a few draws per page, with no
 * scene graph or batcher in between. Pixi's state is handed back with resetState() afterwards.
 * Output matches Pixi's normal blend of the same sprites (premultiplied, ONE / ONE_MINUS_SRC_ALPHA).
 */
export class AvatarAtlasGl
{
    private _gl: WebGL2RenderingContext;
    private _program: WebGLProgram = null;
    private _vao: WebGLVertexArrayObject = null;
    private _vertexBuffer: WebGLBuffer = null;
    private _indexBuffer: WebGLBuffer = null;
    private _sizeLocation: WebGLUniformLocation = null;
    private _data: ArrayBuffer = new ArrayBuffer(MAX_QUADS * 4 * BYTES_PER_VERTEX);
    private _floats: Float32Array = new Float32Array(this._data);
    private _uints: Uint32Array = new Uint32Array(this._data);
    private _quads: number = 0;
    // Texture units of the batch being filled; a batch ends when they run out.
    private _units: Map<TextureSource, number> = new Map();
    private _batchStart: number = 0;
    private _draws: { start: number, count: number, units: TextureSource[] }[] = [];
    private _erases: number = 0;
    private _maxUnits: number = MAX_UNITS;

    public static create(renderer: Renderer): AvatarAtlasGl
    {
        if(!(renderer instanceof WebGLRenderer)) return null;

        const gl = renderer.gl;

        if((typeof WebGL2RenderingContext === 'undefined') || !(gl instanceof WebGL2RenderingContext)) return null;

        const writer = new AvatarAtlasGl(gl);

        return writer.init() ? writer : null;
    }

    private constructor(gl: WebGL2RenderingContext)
    {
        this._gl = gl;
    }

    private init(): boolean
    {
        const gl = this._gl;
        const compile = (type: number, source: string): WebGLShader =>
        {
            const shader = gl.createShader(type);

            gl.shaderSource(shader, source);
            gl.compileShader(shader);

            if(gl.getShaderParameter(shader, gl.COMPILE_STATUS)) return shader;

            gl.deleteShader(shader);

            return null;
        };

        this._maxUnits = Math.min(MAX_UNITS, gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS) as number);

        const vertex = compile(gl.VERTEX_SHADER, VERTEX);
        const fragment = compile(gl.FRAGMENT_SHADER, FRAGMENT);

        if(!vertex || !fragment) return false;

        const program = gl.createProgram();

        gl.attachShader(program, vertex);
        gl.attachShader(program, fragment);
        gl.bindAttribLocation(program, 0, 'aPosition');
        gl.bindAttribLocation(program, 1, 'aUV');
        gl.bindAttribLocation(program, 2, 'aColor');
        gl.bindAttribLocation(program, 3, 'aTexture');
        gl.linkProgram(program);
        gl.deleteShader(vertex);
        gl.deleteShader(fragment);

        if(!gl.getProgramParameter(program, gl.LINK_STATUS))
        {
            gl.deleteProgram(program);

            return false;
        }

        this._program = program;
        this._sizeLocation = gl.getUniformLocation(program, 'uSize');

        gl.useProgram(program);

        for(let unit = 0; unit < MAX_UNITS; unit++) gl.uniform1i(gl.getUniformLocation(program, `uTextures[${ unit }]`), Math.min(unit, this._maxUnits - 1));

        const indices = new Uint16Array(MAX_QUADS * 6);

        for(let quad = 0, vertex = 0; quad < MAX_QUADS; quad++, vertex += 4)
        {
            indices.set([vertex, vertex + 1, vertex + 2, vertex, vertex + 2, vertex + 3], quad * 6);
        }

        this._vao = gl.createVertexArray();
        gl.bindVertexArray(this._vao);

        this._indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this._indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        this._vertexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, this._data.byteLength, gl.DYNAMIC_DRAW);

        gl.enableVertexAttribArray(0);
        gl.vertexAttribPointer(0, 2, gl.FLOAT, false, BYTES_PER_VERTEX, 0);
        gl.enableVertexAttribArray(1);
        gl.vertexAttribPointer(1, 2, gl.FLOAT, false, BYTES_PER_VERTEX, 8);
        gl.enableVertexAttribArray(2);
        gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, BYTES_PER_VERTEX, 16);
        gl.enableVertexAttribArray(3);
        gl.vertexAttribPointer(3, 1, gl.FLOAT, false, BYTES_PER_VERTEX, 20);

        gl.bindVertexArray(null);

        return true;
    }

    public get full(): boolean
    {
        return (this._quads >= MAX_QUADS);
    }

    // Erase quads must all come before the first textured quad of a flush.
    public eraseRect(x: number, y: number, width: number, height: number): boolean
    {
        if(this._quads >= MAX_QUADS) return false;

        this.writeQuad(x, y, (x + width), (y + height), 0, 0, 0, 0, 0, 0, 0, 0, 0, 31);
        this._erases++;
        this._batchStart = this._quads;

        return true;
    }

    private writeQuad(left: number, top: number, right: number, bottom: number, u0: number, v0: number, u1: number, v1: number, u2: number, v2: number, u3: number, v3: number, color: number, textureId: number): void
    {
        const floats = this._floats;
        const uints = this._uints;

        let index = (this._quads * 4 * FLOATS_PER_VERTEX);

        floats[index] = left; floats[index + 1] = top; floats[index + 2] = u0; floats[index + 3] = v0; uints[index + 4] = color; floats[index + 5] = textureId;
        index += FLOATS_PER_VERTEX;
        floats[index] = right; floats[index + 1] = top; floats[index + 2] = u1; floats[index + 3] = v1; uints[index + 4] = color; floats[index + 5] = textureId;
        index += FLOATS_PER_VERTEX;
        floats[index] = right; floats[index + 1] = bottom; floats[index + 2] = u2; floats[index + 3] = v2; uints[index + 4] = color; floats[index + 5] = textureId;
        index += FLOATS_PER_VERTEX;
        floats[index] = left; floats[index + 1] = bottom; floats[index + 2] = u3; floats[index + 3] = v3; uints[index + 4] = color; floats[index + 5] = textureId;

        this._quads++;
    }

    // The layer's quad at (x, y): the same quad as a Sprite with its texture, anchor 0, its flip and tint.
    public layer(layer: AvatarPartLayer, x: number, y: number): boolean
    {
        if(this._quads >= MAX_QUADS) return false;

        const quad = layer.quad ?? (layer.quad = AvatarAtlasGl.layerQuad(layer));
        const texture = layer.texture;
        const source = texture.source;

        let unit = this._units.get(source);

        if(unit === undefined)
        {
            if(this._units.size >= this._maxUnits) this.breakBatch();

            unit = this._units.size;
            this._units.set(source, unit);
        }

        const uvs = texture.uvs;

        this.writeQuad((quad.left + x), (quad.top + y), (quad.right + x), (quad.bottom + y), uvs.x0, uvs.y0, uvs.x1, uvs.y1, uvs.x2, uvs.y2, uvs.x3, uvs.y3, quad.color, (unit | (quad.unpremultiplied ? 32 : 0)));

        return true;
    }

    private static layerQuad(layer: AvatarPartLayer): AvatarLayerQuad
    {
        const texture = layer.texture;
        const trim = texture.trim;
        const orig = texture.orig;
        const minX = trim ? trim.x : 0;
        const maxX = trim ? (trim.x + trim.width) : orig.width;
        const a = (layer.flipped ? -1 : 1);
        const tint = layer.tint;

        return {
            left: ((a * minX) + layer.x),
            right: ((a * maxX) + layer.x),
            top: ((trim ? trim.y : 0) + layer.y),
            bottom: ((trim ? (trim.y + trim.height) : orig.height) + layer.y),
            // Tints are RGB; the vertex color is RGBA bytes with full alpha.
            color: (((0xFF << 24) | ((tint & 0xFF) << 16) | (tint & 0xFF00) | ((tint >> 16) & 0xFF)) >>> 0),
            unpremultiplied: (texture.source.alphaMode === 'no-premultiply-alpha')
        };
    }

    private breakBatch(): void
    {
        const count = (this._quads - this._batchStart);

        if(count > 0) this._draws.push({ start: this._batchStart, count, units: [...this._units.keys()] });

        this._batchStart = this._quads;
        this._units.clear();
    }

    // Draws everything collected into the target, then hands the GL state back to Pixi.
    public flush(renderer: WebGLRenderer, target: TextureSource): void
    {
        this.breakBatch();

        const gl = this._gl;

        try
        {
            // Every texture a draw samples has to be on the GPU before Pixi's state is put aside.
            const glTextures: WebGLTexture[][] = [];

            for(const draw of this._draws) glTextures.push(draw.units.map(source => renderer.texture.getGlSource(source).texture));

            const renderTarget = renderer.renderTarget.getRenderTarget(target);
            const glRenderTarget = renderer.renderTarget.getGpuRenderTarget(renderTarget) as unknown as { framebuffer: WebGLFramebuffer };

            gl.bindFramebuffer(gl.FRAMEBUFFER, glRenderTarget.framebuffer);
            gl.viewport(0, 0, target.pixelWidth, target.pixelHeight);
            gl.disable(gl.DEPTH_TEST);
            gl.disable(gl.STENCIL_TEST);
            gl.disable(gl.CULL_FACE);
            gl.colorMask(true, true, true, true);

            if(this._quads)
            {
                gl.useProgram(this._program);
                gl.uniform2f(this._sizeLocation, target.width, target.height);
                gl.bindVertexArray(this._vao);
                gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
                gl.bufferSubData(gl.ARRAY_BUFFER, 0, this._floats, 0, (this._quads * 4 * FLOATS_PER_VERTEX));
                gl.disable(gl.SCISSOR_TEST);

                // Every sampler of the program reads some unit. One still holding the page we draw
                // into (the stage samples it) is a feedback loop, and WebGL drops the whole draw.
                for(let unit = 0; unit < this._maxUnits; unit++)
                {
                    gl.activeTexture(gl.TEXTURE0 + unit);
                    gl.bindTexture(gl.TEXTURE_2D, null);
                    gl.bindSampler(unit, null);
                }

                if(this._erases)
                {
                    gl.disable(gl.BLEND);
                    gl.drawElements(gl.TRIANGLES, (this._erases * 6), gl.UNSIGNED_SHORT, 0);
                }

                gl.enable(gl.BLEND);
                gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

                for(let drawIndex = 0; drawIndex < this._draws.length; drawIndex++)
                {
                    const draw = this._draws[drawIndex];
                    const textures = glTextures[drawIndex];

                    for(let unit = 0; unit < textures.length; unit++)
                    {
                        gl.activeTexture(gl.TEXTURE0 + unit);
                        gl.bindTexture(gl.TEXTURE_2D, textures[unit]);
                    }

                    gl.drawElements(gl.TRIANGLES, (draw.count * 6), gl.UNSIGNED_SHORT, (draw.start * 12));
                }

                gl.bindVertexArray(null);
            }
        }
        finally
        {
            this._quads = 0;
            this._erases = 0;
            this._batchStart = 0;
            this._units.clear();
            this._draws.length = 0;

            renderer.resetState();

            // resetState sets Pixi's clear colour cache to transparent without calling gl.clearColor. If an opaque
            // clear (a room preview backdrop) ran before this flush, the next transparent clear would hit the cache
            // and keep the opaque colour, so badges and avatar images got a black or beige background.
            gl.clearColor(0, 0, 0, 0);
        }
    }

    public get quadCount(): number
    {
        return this._quads;
    }

    public destroy(): void
    {
        const gl = this._gl;

        if(!gl.isContextLost())
        {
            gl.deleteProgram(this._program);
            gl.deleteVertexArray(this._vao);
            gl.deleteBuffer(this._vertexBuffer);
            gl.deleteBuffer(this._indexBuffer);
        }

        this._program = null;
        this._vao = null;
        this._vertexBuffer = null;
        this._indexBuffer = null;
    }
}
