// Author: Kaura Peura

/**
 * @module
 * The ECS systems for updating the game world.
 */

import { newActionNone } from './action';
import { delta } from './direction';
import { addVec3, clone, maxVec3, minVec3 } from './math';
import { World } from './world';

export function performActions(w: World) {
    for (const player of w.findPlayers()) {
        const action = player.actor.nextAction;

        switch (action.tag) {
            case 'action-none': {
                continue;
            }

            case 'action-walk': {
                addVec3(player.position, delta(action.dir));
                maxVec3(player.position, w.boundsMin());
                minVec3(player.position, w.boundsMax());
                break;
            }
        }

        player.actor.nextAction = newActionNone();
    }
}

export function updatePlayerMemory(w: World) {
    for (let player of w.findPlayers()) {
        const memory = player.memory;
        memory.position = clone(player.position);
        memory.areaSize = w.size();

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
