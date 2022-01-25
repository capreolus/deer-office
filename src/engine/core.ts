// Author: Kaura Peura

/**
 * @module
 * The core implementation for the game engine.
 */

import { newSpatialCache, SpatialCache } from './cache';
import { performActions, updatePlayerMemory } from './system';
import { World } from './world';

export interface Engine {
    setWorld(world: World|null): void
    stepWorld(): void
}

class EngineImpl implements Engine {
    private _world: World|null = null;
    private _cache: SpatialCache = newSpatialCache();

    setWorld(world: World|null):void {
        this._world = world;
        if (this._world != null) {
            this._cache.rebuild(this._world);
        }
    }

    stepWorld(): void {
        if (this._world == null) {
            return;
        }

        performActions(this._world, this._cache);
        updatePlayerMemory(this._world);
    }
}

export function newEngine(): Engine {
    return new EngineImpl();
}
