// Author: Kaura Peura

/**
 * @module
 * The implementation for the game state.
 */

import { EntityComponents, EntityPlayer, EntityVisible, isEntityPlayer, isEntityVisible } from './entity';

export interface World {
    time(): number
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

    time(): number {
        return this._time;
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

export function newWorld(): World {
    return new WorldImpl();
}
