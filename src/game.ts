// Author: Kaura Peura

/**
 * @module
 * The implementation for the game itself.
 */

import { VisualType } from './engine/appearance';
import { newComponentActor, newComponentAppearance, newComponentCollision, newComponentMemory } from './engine/component';
import { EntityComponents } from './engine/entity';
import { newVec3, Vec3 } from './engine/math';
import { Shape } from './engine/shape';
import { newWorld, World } from './engine/world';

function newFloor(position: Vec3): Partial<EntityComponents> {
    return {
        appearance: newComponentAppearance(VisualType.Floor),
        collision: newComponentCollision(Shape.Floor, Shape.Floor),
        position,
    };
}

function newPlayer(position: Vec3): Partial<EntityComponents> {
    return {
        actor: newComponentActor(),
        appearance: newComponentAppearance(VisualType.Player),
        collision: newComponentCollision(Shape.Filled, Shape.Empty),
        memory: newComponentMemory(),
        position,
    }
}

function newWall(position: Vec3): Partial<EntityComponents> {
    return {
        appearance: newComponentAppearance(VisualType.Wall),
        collision: newComponentCollision(Shape.Filled, Shape.Filled),
        position,
    };
}

function newPlant(position: Vec3): Partial<EntityComponents> {
    return {
        appearance: newComponentAppearance(VisualType.Plant),
        collision: newComponentCollision(Shape.Empty, Shape.Empty),
        position,
    };
}

export function generateWorld(width: number, height: number): World {
    const world = newWorld(newVec3(width, height, 1));

    for (let x = 0; x < width; x++) {
        const hasPillar = Math.random() < 0.8;

        for (let y = 0; y < height; y++) {
            world.insert(newFloor(newVec3(x, y)));

            if (
                (x === 0 || x === width - 1 || y === 0 || y === height - 1) ||
                (hasPillar && 4 <= y && y < height - 4 && 4 <= x && x < width - 4)
            ) {
                world.insert(newWall(newVec3(x, y)));
            } else if (Math.random() < 0.1) {
                world.insert(newPlant(newVec3(x, y)));
            }
        }
    }

    world.insert(newPlayer(newVec3(2, 2)));
    return world;
}
