// Author: Kaura Peura

/**
 * @module
 * The shader and related functionality for the tile display.
 */

import { Float32Vector } from './buffer';
import { TileDisplayCommand, TileMapping } from './tile';
import { programFromSources } from './webgl';

export const VertexSizeInBytes = 48;
export const VertexSizeInElements = 12;

const VertexShader = `
    #version 300 es

    uniform mat4 projection;

    layout(location = 0) in vec2 in_position;
    layout(location = 1) in vec2 in_texCoord;
    layout(location = 2) in vec2 in_texMin;
    layout(location = 3) in vec2 in_texMax;
    layout(location = 4) in vec4 in_color;

    out vec2 texCoord;
    out vec2 texMin;
    out vec2 texMax;
    out vec4 color;

    void main() {
        gl_Position = projection * vec4(in_position.xy, 0.0, 1.0);
        texCoord = in_texCoord;
        texMin = in_texMin;
        texMax = in_texMax;
        color = in_color;
    }
`;

const FragmentShader = `
    #version 300 es
    precision mediump float;

    uniform sampler2D sampler;

    in vec2 texCoord;
    in vec2 texMin;
    in vec2 texMax;
    in vec4 color;

    out vec4 out_color;

    void main() {
        vec2 uv = clamp(texCoord, texMin, texMax);
        out_color = color * texture(sampler, uv);
    }
`;

function trimSource(str: string, tabLength: number = 4) {
    const lines = str.split('\n');

    while (lines.length > 0) {
        if (lines[0].length < 1) { lines.shift(); }
        else { break; }
    }

    while (lines.length > 0) {
        if (lines[lines.length - 1].length < 1) { lines.pop(); }
        else { break; }
    }

    const nonEmptyLines = lines.filter(str => str.length > 1);
    if (nonEmptyLines.length < 1) {
        return '';
    }

    const tabInSpaces = ' '.repeat(tabLength);
    const minIndent = nonEmptyLines
        .map(str => str.replace('\t', tabInSpaces).search(/\S/))
        .map(n => n < 0 ? 0 : n)
        .reduce((min: number, n: number) => Math.min(min, n));

    return lines
        .map(str => str.slice(minIndent).trimEnd())
        .join('\n');
}

export interface TileShaderUniforms {
    readonly projection: WebGLUniformLocation
    readonly sampler: WebGLUniformLocation
}

export interface TileShader {
    readonly uniforms: TileShaderUniforms
    readonly program: WebGLProgram
}

class TileShaderImpl implements TileShader {
    readonly uniforms: TileShaderUniforms;
    readonly program: WebGLProgram;

    constructor (gl: WebGL2RenderingContext) {
        const program =  programFromSources(gl, trimSource(VertexShader), trimSource(FragmentShader));
        const uniforms = {
            projection: gl.getUniformLocation(program, 'projection'),
            sampler: gl.getUniformLocation(program, 'sampler'),
        };

        for (const [k, v] of Object.entries(uniforms)) {
            if (v == null) { throw new Error(`failed to fetch the location for the uniform "${k}"`); }
        }

        this.program = program;
        this.uniforms = uniforms as TileShaderUniforms;
    }
}

export function newTileShader(gl: WebGL2RenderingContext): TileShader {
    return new TileShaderImpl(gl);
}

export function setupAndEnableVertexArrays(gl: WebGL2RenderingContext, buffer: WebGLBuffer) {
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 48, 0);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 48, 8);
    gl.vertexAttribPointer(2, 2, gl.FLOAT, false, 48, 16);
    gl.vertexAttribPointer(3, 2, gl.FLOAT, false, 48, 24);
    gl.vertexAttribPointer(4, 4, gl.FLOAT, false, 48, 32);
    gl.enableVertexAttribArray(0);
    gl.enableVertexAttribArray(1);
    gl.enableVertexAttribArray(2);
    gl.enableVertexAttribArray(3);
    gl.enableVertexAttribArray(4);
    gl.bindBuffer(gl.ARRAY_BUFFER, null);
}

export function quadIndices(count: number): number[] {
    const result = [];
    for (let i = 0; i < count; i++) {
        const offset = 4 * i;
        result.push(offset + 0);
        result.push(offset + 1);
        result.push(offset + 2);
        result.push(offset + 2);
        result.push(offset + 3);
        result.push(offset + 0);
    }

    return result;
}

export function mapTileDisplayListToQuads(out: Float32Vector, list: TileDisplayCommand[], mapping: TileMapping): void {
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
