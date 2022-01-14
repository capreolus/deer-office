// Author: Kaura Peura

/**
 * @module
 * The core implementation for the tile display.
 */

import { Float32Vector, newFloat32Vector } from './buffer';
import { imageBitmapFromURL } from './image';
import { orthoProjection } from './math';
import { newTileShader, setupAndEnableVertexArrays, TileShader, VertexSizeInElements } from './shader';
import { textureFromImage } from './webgl';

const Constants = {
    BatchSizeInQuads: 16384
} as const;

class TileMapping {
    private readonly _nHorzTiles: number
    private readonly _nVertTiles: number

    readonly nTiles: number
    readonly tileWidth: number
    readonly tileHeight: number
    readonly texelWidth: number
    readonly texelHeight: number

    constructor (nHorzTiles: number, nVertTiles: number, texWidth: number, texHeight: number) {
        if (!Number.isInteger(nHorzTiles) || nHorzTiles < 1) { throw new Error('horizontal tile count must be a positive integer'); }
        if (!Number.isInteger(nVertTiles) || nVertTiles < 1) { throw new Error('vertical tile count must be a positive integer'); }
        if (!Number.isInteger(texWidth) || texWidth < 1) { throw new Error('texture width must be a positive integer'); }
        if (!Number.isInteger(texHeight) || texHeight < 1) { throw new Error('texture height must be a positive integer'); }

        const tileWidth = Math.floor(texWidth / nHorzTiles);
        const tileHeight = Math.floor(texHeight / nVertTiles);

        if (tileWidth * nHorzTiles !== texWidth) { throw new Error('texture width is not evenly divisible by horizontal tile count'); }
        if (tileHeight * nVertTiles !== texHeight) { throw new Error('texture height is not evenly divisible by vertical tile count'); }

        this.nTiles = nHorzTiles * nVertTiles;
        this.tileWidth = tileWidth;
        this.tileHeight = tileHeight;
        this.texelWidth = 1.0 / texWidth;
        this.texelHeight = 1.0 / texHeight;

        this._nHorzTiles = nHorzTiles;
        this._nVertTiles = nVertTiles;
    }

    map(index: number): [number, number] {
        return [
            Math.floor(index % this._nHorzTiles) / this._nHorzTiles,
            Math.floor(index / this._nHorzTiles) / this._nVertTiles,
        ];
    }
}

export interface TileDisplayCommand {
    readonly index: number
    readonly x: number
    readonly y: number
    readonly r: number
    readonly g: number
    readonly b: number
    readonly a: number
}

function mapTileDisplayListToQuads(out: Float32Vector, list: TileDisplayCommand[], mapping: TileMapping): void {
    const tileWidth = mapping.tileWidth;
    const tileHeight = mapping.tileHeight
    const tileWidthInTexels = tileWidth * mapping.texelWidth;
    const tileHeightInTexels = tileHeight * mapping.texelHeight;
    const hTexelWidth = 0.5 * mapping.texelWidth;
    const hTexelHeight = 0.5 * mapping.texelHeight;

    for (const entry of list) {
        const index = entry.index;
        if (index < 0 || index >= mapping.nTiles) {
            continue;
        }

        const x1 = entry.x;
        const y1 = entry.y;
        const x2 = x1 + tileWidth;
        const y2 = y1 + tileHeight;

        const texCoord = mapping.map(index);
        const tu1 = texCoord[0];
        const tv2 = texCoord[1];
        const tu2 = tu1 + tileWidthInTexels;
        const tv1 = tv2 + tileHeightInTexels;
        const tuMin = tu1 + hTexelWidth
        const tvMin = tv2 + hTexelHeight
        const tuMax = tu2 - hTexelWidth
        const tvMax = tv1 - hTexelHeight

        const r = entry.r;
        const g = entry.g;
        const b = entry.b;
        const a = entry.a;

        out.push(x1);
        out.push(y1);
        out.push(tu1);
        out.push(tv1);
        out.push(tuMin);
        out.push(tvMin);
        out.push(tuMax);
        out.push(tvMax);
        out.push(r);
        out.push(g);
        out.push(b);
        out.push(a);

        out.push(x2);
        out.push(y1);
        out.push(tu2);
        out.push(tv1);
        out.push(tuMin);
        out.push(tvMin);
        out.push(tuMax);
        out.push(tvMax);
        out.push(r);
        out.push(g);
        out.push(b);
        out.push(a);

        out.push(x2);
        out.push(y2);
        out.push(tu2);
        out.push(tv2);
        out.push(tuMin);
        out.push(tvMin);
        out.push(tuMax);
        out.push(tvMax);
        out.push(r);
        out.push(g);
        out.push(b);
        out.push(a);

        out.push(x1);
        out.push(y2);
        out.push(tu1);
        out.push(tv2);
        out.push(tuMin);
        out.push(tvMin);
        out.push(tuMax);
        out.push(tvMax);
        out.push(r);
        out.push(g);
        out.push(b);
        out.push(a);
    }
}

export interface Display {
    readonly canvas: HTMLCanvasElement;

    resize(width: number, height: number, scale?: number): void
    setTileSet(name: string, imageUrl: string, nHorzTiles: number, nVertTiles: number): Promise<void>
    tileSize(tilesetName: string): [number, number];
    clear(r: number, g: number, b: number, a: number): void
    drawSprites(tilesetName: string, list: TileDisplayCommand[]): void
}

interface Tileset {
    readonly mapping: TileMapping
    readonly texture: WebGLTexture
}

class DisplayImpl implements Display {
    private readonly _gl: WebGL2RenderingContext;
    private readonly _vertexArray: WebGLVertexArrayObject;
    private readonly _vertexBuffer: WebGLBuffer;
    private readonly _shader: TileShader;

    private readonly _vertexCache: Float32Vector = newFloat32Vector();
    private readonly _nameToTileSet: Map<string, Tileset> = new Map();

    readonly canvas: HTMLCanvasElement;

    constructor (width: number, height: number, scaling: number = 1) {
        const canvas = document.createElement('canvas');
        canvas.style.imageRendering = 'pixelated';

        const gl = canvas.getContext('webgl2');
        if (gl == null) {
            throw new Error('failed to acquire a WebGL2 context');
        }

        const vertexArray = gl.createVertexArray();
        if (vertexArray == null) {
            throw new Error('failed to create a vertex array');
        }

        const vertexBuffer = gl.createBuffer();
        const indexBuffer = gl.createBuffer();
        if (vertexBuffer == null || indexBuffer == null) {
            throw new Error('failed to allocate buffers');
        }

        const indices = [];
        for (let i = 0; i < Constants.BatchSizeInQuads; i++) {
            const offset = 4 * i;
            indices.push(offset + 0);
            indices.push(offset + 1);
            indices.push(offset + 2);
            indices.push(offset + 2);
            indices.push(offset + 3);
            indices.push(offset + 0);
        }

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        const shader = newTileShader(gl);
        gl.bindVertexArray(vertexArray);
        setupAndEnableVertexArrays(gl, vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindVertexArray(null);

        this._shader = shader;
        this._vertexArray = vertexArray;
        this._vertexBuffer = vertexBuffer;
        this._gl = gl;

        this.canvas = canvas;
        this.resize(width, height, scaling);
    }

    resize(width: number, height: number, scaling: number = 2): void {
        this.canvas.width = width;
        this.canvas.height = height;
        this.canvas.style.width = `${scaling * width}px`;
        this.canvas.style.height = `${scaling * height}px`;
        this._gl.viewport(0, 0, width, height);
    }

    async setTileSet(name: string, imageUrl: string, nHorzTiles: number, nVertTiles: number): Promise<void> {
        const image = await imageBitmapFromURL(imageUrl);
        const mapping = new TileMapping(nHorzTiles, nVertTiles, image.width, image.height);
        const texture = textureFromImage(this._gl, image);
        const oldTileset = this._nameToTileSet.get(name);

        if (oldTileset != null) { this._gl.deleteTexture(oldTileset.texture); }
        this._nameToTileSet.set(name, { mapping, texture });
    }

    tileSize(tilesetName: string): [number, number] {
        const tileset = this._nameToTileSet.get(tilesetName);
        if (tileset == null) {
            throw new Error(`no tileset with the name "${tilesetName}"`);
        }

        return [
            tileset.mapping.tileWidth,
            tileset.mapping.tileHeight,
        ];
    }

    clear(r: number, g: number, b: number, a: number): void {
        this._gl.clearColor(r, g, b, a);
        this._gl.clear(this._gl.COLOR_BUFFER_BIT);
    }

    drawSprites(tilesetName: string, list: TileDisplayCommand[]): void {
        const tileset = this._nameToTileSet.get(tilesetName);
        if (tileset == null) {
            throw new Error(`no tileset with the name "${tilesetName}"`);
        }

        this._vertexCache.clear();
        mapTileDisplayListToQuads(this._vertexCache, list, tileset.mapping);

        const projection = orthoProjection(0, this.canvas.width, 0, this.canvas.height, -1.0, 1.0);
        const array = this._vertexCache.array();
        const gl = this._gl;

        gl.bindBuffer(gl.ARRAY_BUFFER, this._vertexBuffer);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
        gl.enable(gl.BLEND);

        gl.bindVertexArray(this._vertexArray);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, tileset.texture);

        gl.useProgram(this._shader.program);
        gl.uniformMatrix4fv(this._shader.uniforms.projection, false, projection);
        gl.uniform1i(this._shader.uniforms.sampler, 0);

        for (let quadOffset = 0; quadOffset < list.length; quadOffset += Constants.BatchSizeInQuads) {
            const nQuads = Math.min(Constants.BatchSizeInQuads, list.length - quadOffset);
            const elementOffset = 4 * quadOffset * VertexSizeInElements;
            const nElements = 4 * nQuads * VertexSizeInElements;

            gl.bufferData(gl.ARRAY_BUFFER, array, gl.DYNAMIC_DRAW, elementOffset, nElements);
            gl.drawElements(gl.TRIANGLES, 6 * nQuads, gl.UNSIGNED_SHORT, 0);
        }

        gl.bindTexture(gl.TEXTURE_2D, null);
        gl.bindVertexArray(null);

        gl.disable(gl.BLEND);
        gl.blendFunc(gl.ONE, gl.ZERO);
        gl.bindBuffer(gl.ARRAY_BUFFER, null);
    }
}

export function newDisplay(width: number = 256, height: number = 256, scale: number = 2): Display {
    return new DisplayImpl(width, height, scale);
}
