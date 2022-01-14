// Author: Kaura Peura

/**
 * @module
 * WebGL2 utilities.
 */

export function shaderFromSource(gl: WebGL2RenderingContext, type: any, src: string): WebGLShader {
    const shader = gl.createShader(type);
    if (shader == null) {
        throw new Error('failed to create a WebGL shader');
    }

    gl.shaderSource(shader, src);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS) ) {
        const info = gl.getShaderInfoLog(shader);
        const withLineNumbers = (src: string) => {
            const lines = src.split('\n');
            if (lines.length < 1) { return ''; }
            const n = 1 + Math.floor(Math.log10(lines.length + 1));
            return lines.map((str, i) => `${`${i + 1}`.padStart(n, ' ')}: ${str}`).join('\n');
        };

        throw new Error(`failed to compile a WebGL shader\n\n${info}\n${withLineNumbers(src)}`);
    }

    return shader;
}

export function programFromSources(gl: WebGL2RenderingContext, vsSource: string, fsSource: string): WebGLProgram {
    const vs = shaderFromSource(gl, gl.VERTEX_SHADER, vsSource);
    const fs = shaderFromSource(gl, gl.FRAGMENT_SHADER, fsSource);
    const program = gl.createProgram();

    if (program == null) {
        throw new Error('failed to create a WebGL program');
    }

    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);

    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        const info = gl.getProgramInfoLog(program);
        throw new Error(`failed to compile a WebGL program\n\n${info}`);
    }

    return program;
}

export function textureFromImage(gl: WebGL2RenderingContext, image: ImageBitmap): WebGLTexture {
    const texture = gl.createTexture();
    if (texture == null) {
        throw new Error('failed to create a WebGL texture');
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
        gl.TEXTURE_2D,
        0,
        gl.RGBA,
        image.width,
        image.height,
        0,
        gl.RGBA,
        gl.UNSIGNED_BYTE,
        image
    );

    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.bindTexture(gl.TEXTURE_2D, null);

    return texture;
}
