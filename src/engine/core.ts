// Author: Kaura Peura

/**
 * @module
 * The core implementation for the game engine.
 */

import { Cache, newCache } from './cache';
import { performActions, updatePlayerMemory } from './system';
import { World } from './world';

export interface Engine {
    setWorld(world: World|null): void
    stepWorld(): void
}

class EngineImpl implements Engine {
    private _world: World|null = null;
    private _cache: Cache = newCache();

    setWorld(world: World|null):void {
        this._world = world;
        if (this._world != null) {
            this._cache.spatial.rebuild(this._world);
            this._cache.fieldOfView.rebuild(this._world);
            updatePlayerMemory(this._world, this._cache);
        }
    }

    stepWorld(): void {
        if (this._world == null) { return; }
        const tBegin = performance.now();
        performActions(this._world, this._cache);
        updatePlayerMemory(this._world, this._cache);
        const tEnd = performance.now();
        console.log(`Game turn ${this._world.time()} took: ${tEnd - tBegin}ms`);
        this._world.stepTime();
    }
}

export function newEngine(): Engine {
    return new EngineImpl();
}
