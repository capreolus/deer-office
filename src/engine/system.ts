// Author: Kaura Peura

/**
 * @module
 * The ECS systems for updating the game world.
 */

import { newActionNone } from './action';
import { delta } from './direction';
import { addVec3, clone } from './math';
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
