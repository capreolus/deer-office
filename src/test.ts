// Author: Kaura Peura

/**
 * @module
 * Testing utilities.
 */

import { TileDisplayCommand } from './display';

export function testDisplayList(tileWidth: number, tileHeight: number, widthInTiles: number, heightInTiles: number): TileDisplayCommand[] {
    const result: TileDisplayCommand[] = [];

    for (let y = 0; y < heightInTiles; y++) {
        for (let x = 0; x < widthInTiles; x++) {
            result.push({
                index: (x + y * widthInTiles) % 256,
                x: x * tileWidth, y:
                y * tileHeight,
                r: x / widthInTiles % 1.0,
                g: y / heightInTiles % 1.0,
                b: x * y / widthInTiles / heightInTiles % 1.0,
                a: 1.0
            });
        }
    }

    return result;
}
