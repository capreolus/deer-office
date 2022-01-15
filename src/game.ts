// Author: Kaura Peura

/**
 * @module
 * The implementation for the game itself.
 */

import { VisualType } from './engine/appearance';
import { newComponentActor, newComponentAppearance, newComponentMemory } from './engine/component';
import { EntityComponents } from './engine/entity';
import { newVec3, Vec3 } from './engine/math';
import { updatePlayerMemory } from './engine/system';
import { newWorld, World } from './engine/world';

function newFloor(position: Vec3): Partial<EntityComponents> {
    return {
        position,
        appearance: newComponentAppearance(VisualType.Floor),
    };
}

function newPlayer(position: Vec3): Partial<EntityComponents> {
    return {
        actor: newComponentActor(),
        memory: newComponentMemory(),
        position,
        appearance: newComponentAppearance(VisualType.Player),
    }
}

function newWall(position: Vec3): Partial<EntityComponents> {
    return {
        position,
        appearance: newComponentAppearance(VisualType.Wall),
    };
}

export function generateWorld(width: number, height: number): World {
    const world = newWorld(newVec3(width, height, 1));

    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            world.insert(newFloor(newVec3(x, y)));
            if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                world.insert(newWall(newVec3(x, y)));
            }
        }
    }

    world.insert(newPlayer(newVec3(2, 2)));
    updatePlayerMemory(world);
    return world;
}
