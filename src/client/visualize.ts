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
    readonly index: number
    readonly r: number
    readonly g: number
    readonly b: number
    readonly a: number
}

function impressionToTile(impression: Impression): Tile {
    switch (impression.visualType) {
        case VisualType.Floor: return { index: 249, r: 0.4, g: 0.3, b: 0.2, a: 1.0 };
        case VisualType.Plant: return { index: 231, r: 0.2, g: 0.6, b: 0.2, a: 1.0 };
        case VisualType.Player: return { index: 64, r: 1.0, g: 1.0, b: 0.9, a: 1.0 };
        case VisualType.Wall: return { index: 35, r: 0.9, g: 0.7, b: 0.4, a: 1.0 };
    }

    return { index: 63, r: 1.0, g: 0.0, b: 1.0, a: 1.0 };
}

function impressionToPriority(impression: Impression): number {
    switch (impression.visualType) {
        case VisualType.Floor: return 3;
        case VisualType.Plant: return 2;
        case VisualType.Player: return 0;
        case VisualType.Wall: return 1;
    }

    return -1;
}

export function visualize(memory: ComponentMemory, displayWidth: number, displayHeight: number, tileWidth: number, tileHeight: number): TileDisplayCommand[] {
    const list = [...memory.entities.values()];
    list.sort((a: Impression, b: Impression) => {
        const [ax, ay, az] = a.position;
        const [bx, by, bz] = b.position;

        if (ay < by) { return -1; }
        if (ay > by) { return 1; }
        if (ax < bx) { return -1; }
        if (ax > bx) { return 1; }
        if (az > bz) { return -1; }
        if (az < bz) { return 1; }

        return impressionToPriority(a) - impressionToPriority(b);
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

    const time = memory.areaTime;

    let xLast: number = Number.MIN_SAFE_INTEGER;
    let yLast: number = Number.MIN_SAFE_INTEGER;

    for (let impression of list) {
        if (impression.position[0] === xLast && impression.position[1] === yLast) {
            continue;
        }

        const tile = impressionToTile(impression);
        const brightness = impression.time < time ? 0.5 : 1.0;

        result.push({
            index: tile.index,
            x: (impression.position[0] - xWindow) * tileWidth,
            y: (impression.position[1] - yWindow) * tileHeight,
            r: tile.r * brightness,
            g: tile.g * brightness,
            b: tile.b * brightness,
            a: tile.a,
        })

        xLast = impression.position[0];
        yLast = impression.position[1];
    }

    return result;
}
