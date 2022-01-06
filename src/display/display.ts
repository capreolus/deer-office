// Author: Kaura Peura

/**
 * @module
 * The core implementation for the tile display.
 */

import { Float32Vector, newFloat32Vector } from './buffer';
import { imageBitmapFromURL } from './image';
import { orthoProjection } from './math';
import { mapTileDisplayListToQuads, newTileShader, quadIndices, setupAndEnableVertexArrays, TileShader, VertexSizeInElements } from './shader';
import { newTileMapping, TileDisplayCommand, TileMapping } from './tile';
import { textureFromImage } from './webgl';

const Constants = {
    BatchSizeInQuads: 16384
} as const;

interface Tileset {
    readonly mapping: TileMapping
    readonly texture: WebGLTexture
}

export interface Display {
    readonly canvas: HTMLCanvasElement;

    resize(width: number, height: number, scale?: number): void
    setTileSet(name: string, imageUrl: string, nHorzTiles: number, nVertTiles: number): Promise<void>
    tileSize(tilesetName: string): [number, number];
    clear(r: number, g: number, b: number, a: number): void
    drawSprites(tilesetName: string, list: TileDisplayCommand[]): void
}

class DisplayImpl implements Display {
    private readonly _gl: WebGL2RenderingContext;
    private readonly _vertexArray: WebGLVertexArrayObject;
    private readonly _vertexBuffer: WebGLBuffer;
    private readonly _indexBuffer: WebGLBuffer;
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

        const indices = new Uint16Array(quadIndices(Constants.BatchSizeInQuads));
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

        const shader = newTileShader(gl);
        gl.bindVertexArray(vertexArray);
        setupAndEnableVertexArrays(gl, vertexBuffer);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer);
        gl.bindVertexArray(null);

        this._shader = shader;
        this._vertexArray = vertexArray;
        this._vertexBuffer = vertexBuffer;
        this._indexBuffer = indexBuffer;
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
        const mapping = newTileMapping(nHorzTiles, nVertTiles, image.width, image.height);
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
