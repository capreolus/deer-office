// Author: Kaura Peura

/**
 * @module
 * The implementation for translating player memory into tile graphics.
 */

import { TileDisplayCommand } from './display/core';
import { VisualType } from '../engine/appearance';
import { Impression } from '../engine/impression';
import { ComponentMemory } from '../engine/component';

interface Tile {
    readonly tileIndex: number
    readonly r: number
    readonly g: number
    readonly b: number
    readonly a: number
}

function mapImpressionToTile(impression: Impression): Tile {
    switch (impression.visualType) {
        case VisualType.Floor: return { tileIndex: 249, r: 0.1, g: 0.1, b: 0.1, a: 1.0 };
        case VisualType.Plant: return { tileIndex: 231, r: 0.2, g: 0.6, b: 0.2, a: 1.0 };
        case VisualType.Player: return { tileIndex: 64, r: 1.0, g: 1.0, b: 0.9, a: 1.0 };
        case VisualType.Wall: return { tileIndex: 35, r: 0.9, g: 0.7, b: 0.4, a: 1.0 };
    }

    return { tileIndex: 63, r: 1.0, g: 0.0, b: 1.0, a: 1.0 };
}

export function visualize(memory: ComponentMemory, displayWidth: number, displayHeight: number, tileWidth: number, tileHeight: number): TileDisplayCommand[] {
    const list = [...memory.entities.values()];
    list.sort((a: Impression, b: Impression) => {
        const [ax, ay, az] = a.position;
        const [bx, by, bz] = b.position;

        if (az < by) { return -1; }
        if (az > bz) { return 1; }
        if (ay < by) { return -1; }
        if (ay > by) { return 1; }
        if (ax < bx) { return -1; }
        if (ax > bx) { return 1; }
        return 0;
    });

    const result: TileDisplayCommand[] = [];
    const xOffset = Math.floor(displayWidth / 2);
    const yOffset = Math.floor(displayHeight / 2);

    let xWindow;
    if (displayWidth < memory.areaSize[0]) {
        xWindow = Math.max(0, Math.min(memory.areaSize[0] - displayWidth, memory.position[0] - xOffset));
    } else {
        xWindow = Math.floor(memory.areaSize[0] / 2) - Math.floor(displayWidth / 2);
    }

    let yWindow;
    if (displayHeight < memory.areaSize[1]) {
        yWindow = Math.max(0, Math.min(memory.areaSize[1] - displayHeight, memory.position[1] - yOffset));
    } else {
        yWindow = Math.floor(memory.areaSize[1] / 2) - Math.floor(displayHeight / 2);
    }

    for (let impression of list) {
        const viz = mapImpressionToTile(impression);
        result.push({
            index: viz.tileIndex,
            x: (impression.position[0] - xWindow) * tileWidth,
            y: (impression.position[1] - yWindow) * tileHeight,
            r: viz.r,
            g: viz.g,
            b: viz.b,
            a: viz.a,
        })
    }

    return result;
}
