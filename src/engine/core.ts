// Author: Kaura Peura

/**
 * @module
 * The core implementation for the game engine.
 */

import { updatePlayerMemory } from './system';
import { World } from './world';

export function step(world: World) {
    updatePlayerMemory(world);
    world.step();
}
