// Author: Kaura Peura

/**
 * @module
 * Common tile types and functionality.
 */

export interface TileDisplayCommand {
    readonly index: number
    readonly x: number
    readonly y: number
    readonly r: number
    readonly g: number
    readonly b: number
    readonly a: number
}

export interface TileMapping {
    readonly nTiles: number
    readonly tileWidth: number
    readonly tileHeight: number
    readonly texelWidth: number
    readonly texelHeight: number

    map(index: number): [number, number]
}

class TileMappingImpl {
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

export function newTileMapping(nHorzTiles: number, nVertTiles: number, texWidth: number, texHeight: number): TileMapping {
    return new TileMappingImpl(nHorzTiles, nVertTiles, texWidth, texHeight);
}
