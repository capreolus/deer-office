// Author: Kaura Peura

/**
 * @module
 * The core implementation for the game engine.
 */

import { performActions, updatePlayerMemory } from './system';
import { World } from './world';

export function step(world: World) {
    performActions(world);
    updatePlayerMemory(world);
    world.step();
}
