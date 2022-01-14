// Author: Kaura Peura

/**
 * @module
 * The ECS systems for updating the game world.
 */

import { clone } from './math';
import { World } from './world';

export function updatePlayerMemory(w: World) {
    for (let player of w.findPlayers()) {
        const memory = player.memory;

        for (let entity of w.findVisible()) {
            memory.entities.set(entity.id, {
                id: entity.id,
                position: clone(entity.position),
                time: w.time(),
                visualType: entity.appearance.visualType
            });
        }
    }
}
