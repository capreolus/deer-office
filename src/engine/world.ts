// Author: Kaura Peura

/**
 * @module
 * The implementation for the game state.
 */

import { EntityComponents, EntityPlayer, EntityVisible, isEntityPlayer, isEntityVisible } from './entity';
import { clone, newVec3, subVec3, Vec3 } from './math';

export interface World {
    time(): number

    size(): Vec3
    boundsMin(): Vec3
    boundsMax(): Vec3

    findPlayers(): readonly EntityPlayer[]
    findVisible(): readonly EntityVisible[]

    step(): void
    insert(entity: Partial<EntityComponents>): void
}

class WorldImpl implements World {
    private readonly _playerEntities: EntityPlayer[] = [];
    private readonly _visibleEntitites: EntityVisible[] = [];

    private _nextId: number = 1;
    private _time: number = 0;
    private _size: Vec3;

    constructor (size: Vec3) {
        if (size.some(e => !Number.isInteger(e) || e < 1)) { throw new Error('world dimensions must be positive integers'); }
        this._size = clone(size);
    }

    time(): number {
        return this._time;
    }

    size(): Vec3 {
        return clone(this._size);
    }

    boundsMin(): Vec3 {
        return newVec3(0, 0, 0);
    }

    boundsMax(): Vec3 {
        return subVec3(clone(this._size), newVec3(1, 1, 1));
    }

    findPlayers(): readonly EntityPlayer[] {
        return this._playerEntities;
    }

    findVisible(): readonly EntityVisible[] {
        return this._visibleEntitites;
    }

    step() {
        this._time++;
    }

    insert(components: Partial<EntityComponents>): void {
        const entity = {
            id: this._nextId++,
            actor: components.actor ?? null,
            appearance: components.appearance ?? null,
            memory: components.memory ?? null,
            position: components.position ?? null,
        };

        if (isEntityPlayer(entity)) { this._playerEntities.push(entity); }
        if (isEntityVisible(entity)) { this._visibleEntitites.push(entity); }
    }
}

export function newWorld(size: Vec3): World {
    return new WorldImpl(size);
}
