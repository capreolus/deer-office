// Author: Kaura Peura

/**
 * @module
 * The ECS systems for updating the game world.
 */

import { newActionNone } from './action';
import { Cache, CellFlag, SpatialCache } from './cache';
import { delta, Direction2D } from './direction';
import { EntityPositioned } from './entity';
import { cloneVec3, copyVec3, isInsideVec3, newVec3, ReadonlyVec3, sumVec3 } from './math';
import { World } from './world';

function moveEntity(entity: EntityPositioned, spatialCache: SpatialCache, newPosition: ReadonlyVec3) {
    const oldPosition = cloneVec3(entity.position);
    copyVec3(entity.position, newPosition);
    spatialCache.entityMoved(entity, oldPosition);
}

export function performActions(world: World, cache: Cache) {
    const wMin = world.boundsMin();
    const wMax = world.boundsMax();
    const spatialCache = cache.spatial;
    const canStep = (v: ReadonlyVec3) => isInsideVec3(v, wMin, wMax) && (spatialCache.cellFlags(v) & CellFlag.FilledPhysical) === 0x0;

    for (const player of world.findPlayers()) {
        const action = player.actor.nextAction;

        switch (action.tag) {
            case 'action-none': {
                continue;
            }

            case 'action-walk': {
                switch (action.dir) {
                    case Direction2D.East:
                    case Direction2D.North:
                    case Direction2D.West:
                    case Direction2D.South: {
                        const step = delta(action.dir);
                        const targetXY = sumVec3(player.position, step);

                        if (canStep(targetXY)) {
                            moveEntity(player, spatialCache, targetXY);
                        }

                        break;
                    }

                    case Direction2D.NorthEast:
                    case Direction2D.NorthWest:
                    case Direction2D.SouthWest:
                    case Direction2D.SouthEast: {
                        const step = delta(action.dir);
                        const targetXY = sumVec3(player.position, step);
                        const targetX = sumVec3(player.position, newVec3(step[0], 0, 0));
                        const targetY = sumVec3(player.position, newVec3(0, step[1], 0));

                        if (canStep(targetXY)) {
                            moveEntity(player, spatialCache, targetXY);
                        } else if (canStep(targetX) && !canStep(targetY)) {
                            moveEntity(player, spatialCache, targetX);
                        } else if (!canStep(targetX) && canStep(targetY)) {
                            moveEntity(player, spatialCache, targetY);
                        }

                        break;
                    }

                    default:
                        throw new Error(`unhandled direction: ${action.dir}`);
                }

                break;
            }
        }

        player.actor.nextAction = newActionNone();
    }
}

export function updatePlayerMemory(world: World, cache: Cache) {
    for (let player of world.findPlayers()) {
        const memory = player.memory;
        memory.position = cloneVec3(player.position);
        memory.areaSize = world.size();
        memory.areaTime = world.time();

        const fieldOfViewCache = cache.fieldOfView;
        fieldOfViewCache.update(player.position, 16, cache.spatial);

        for (let entity of world.findVisible()) {
            if (!fieldOfViewCache.isVisible(entity.position)) {
                continue;
            }

            memory.entities.set(entity.id, {
                id: entity.id,
                position: cloneVec3(entity.position),
                time: world.time(),
                visualType: entity.appearance.visualType
            });
        }
    }
}
