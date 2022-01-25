// Author: Kaura Peura

/**
 * @module
 * The implementation for the game state.
 */

import { Entity, EntityComponents, EntityPhysical, EntityPlayer, EntityVisible, isEntityPhysical, isEntityPlayer, isEntityVisible } from './entity';
import { cloneVec3, diffVec3XYZ, newVec3, Vec3 } from './math';

export interface World {
    time(): number
    size(): Vec3
    boundsMin(): Vec3
    boundsMax(): Vec3

    entities(): readonly Entity[]
    findPhysical(): readonly EntityPhysical[]
    findPlayers(): readonly EntityPlayer[]
    findVisible(): readonly EntityVisible[]

    stepTime(): void
    insert(entity: Partial<EntityComponents>): void
}

class WorldImpl implements World {
    private readonly _entities: Entity[] = [];
    private readonly _physicalEntities: EntityPhysical[] = [];
    private readonly _playerEntities: EntityPlayer[] = [];
    private readonly _visibleEntitites: EntityVisible[] = [];

    private _nextId: number = 1;
    private _time: number = 0;
    private _size: Vec3;

    constructor (size: Vec3) {
        if (size.some(e => !Number.isInteger(e) || e < 1)) { throw new Error('world dimensions must be positive integers'); }
        this._size = cloneVec3(size);
    }

    time(): number {
        return this._time;
    }

    size(): Vec3 {
        return cloneVec3(this._size);
    }

    boundsMin(): Vec3 {
        return newVec3(0, 0, 0);
    }

    boundsMax(): Vec3 {
        return diffVec3XYZ(this._size, 1, 1, 1);
    }

    entities(): readonly Entity[] {
        return this._entities;
    }

    findPhysical(): readonly EntityPhysical[] {
        return this._physicalEntities;
    }

    findPlayers(): readonly EntityPlayer[] {
        return this._playerEntities;
    }

    findVisible(): readonly EntityVisible[] {
        return this._visibleEntitites;
    }

    stepTime() {
        this._time++;
    }

    insert(components: Partial<EntityComponents>): void {
        const entity = {
            id: this._nextId++,
            actor: components.actor ?? null,
            appearance: components.appearance ?? null,
            collision: components.collision ?? null,
            memory: components.memory ?? null,
            position: components.position ?? null,
        };

        this._entities.push(entity);
        if (isEntityPhysical(entity)) { this._physicalEntities.push(entity); }
        if (isEntityPlayer(entity)) { this._playerEntities.push(entity); }
        if (isEntityVisible(entity)) { this._visibleEntitites.push(entity); }
    }
}

export function newWorld(size: Vec3): World {
    return new WorldImpl(size);
}
