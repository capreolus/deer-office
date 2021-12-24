// Author: Kaura Peura

/**
 * @module
 * A toolset for displaying 2D graphics.
 */

export interface Coord2D {
    readonly x: number
    readonly y: number
}

export function tileCoordinatesFromGrid(
    tileWidth: number,
    tileHeight: number,
    widthInTiles: number,
    heightInTiles: number
): Coord2D[] {

    const result: Coord2D[] = [];
    for (let y = 0; y < heightInTiles; y++) {
        for (let x = 0; x < widthInTiles; x++) {
            result.push({ x: x * tileWidth, y: y * tileHeight });
        }
    }

    return result;
}

interface TileSet {
    readonly image: ImageBitmap
    readonly tileWidth: number
    readonly tileHeight: number
    readonly coordinates: readonly Coord2D[]
}

export function newTileSet(
    image: ImageBitmap,
    tileWidth: number,
    tileHeight: number,
    coordinates: Coord2D[]
): TileSet {

    if (coordinates.length < 1) {
        throw new Error('a tileset must have at least one tile');
    }

    return {
        image,
        tileWidth,
        tileHeight,
        coordinates: coordinates.map(e => ({ ...e })),
    };
}

export interface TileDrawEntry {
    readonly index: number
    readonly x: number
    readonly y: number
}

export interface Display {
    canvas(): HTMLCanvasElement;
    setSize(width: number, height: number): void
    clear(cssColor: string): void
    drawSprites(set: TileSet, list: TileDrawEntry[]): void
}

class DisplayImpl implements Display {
    private readonly _canvas: HTMLCanvasElement;
    private _ctx: CanvasRenderingContext2D;

    constructor (width: number, height: number) {
        this._canvas = document.createElement('canvas');
        const ctx = this._canvas.getContext('2d');
        if (ctx == null) {
            throw new Error('failed to get canvas 2D context');
        }

        this._ctx = ctx;
        this.setSize(width, height);
    }

    canvas(): HTMLCanvasElement {
        return this._canvas;
    }

    setSize(width: number, height: number): void {
        if (!Number.isInteger(width) || width < 1) { throw new Error('display width must be a positive integer'); }
        if (!Number.isInteger(height) || height < 1) { throw new Error('display height must be a positive integer'); }
        this._canvas.width = width;
        this._canvas.height = height;
    }

    clear(cssColor: string): void {
        this._ctx.fillStyle = cssColor;
        this._ctx.globalCompositeOperation = 'copy';
        this._ctx.fillRect(0, 0, this._canvas.width, this._canvas.height);
    }

    drawSprites(set: TileSet, list: TileDrawEntry[]): void {
        const { image, tileWidth, tileHeight, coordinates  } = set;
        this._ctx.globalCompositeOperation = 'source-over';

        for (let e of list) {
            const index = e.index >= 0 && e.index < coordinates.length ? e.index : coordinates.length - 1;
            const coord = coordinates[index]
            this._ctx.drawImage(image, coord.x, coord.y, tileWidth, tileHeight, e.x, e.y, tileWidth, tileHeight);
        }
    }
}

export function newDisplay(width: number, height: number): Display {
    return new DisplayImpl(width, height);
}

export function imageBitmapFromURL(url: string): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
        try {
            const image = new Image();
            image.addEventListener('error', (e: ErrorEvent) => { reject(new Error(e.message)); });
            image.addEventListener('load', () => { resolve(createImageBitmap(image)); });
            image.src = url;
        } catch (err) {
            reject(err);
        }
    });
}
