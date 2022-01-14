// Author: Kaura Peura

/**
 * @module
 * The game server.
 */

const Constants = {
    WorldWidth: 64,
    WorldHeight: 64,
} as const;

import { ComponentMemory } from './engine/component';
import { step } from './engine/core';
import { World } from './engine/world';
import { generateWorld } from './game';

export interface Server {
    commandGenerateWorld(): void
    commandGetPlayerMemory(): ComponentMemory|null
    commandStepGame(): boolean
}

class ServerImpl {
    private _world: World|null = null;

    commandGenerateWorld(): void {
        this._world = generateWorld(Constants.WorldWidth, Constants.WorldHeight);
    }

    commandGetPlayerMemory(): ComponentMemory|null {
        if (this._world == null) { return null; }
        const players = this._world.findPlayers();
        if (players.length < 1) { return null; }
        return players[0].memory;
    }

    commandStepGame(): boolean {
        if (this._world == null) { return false; }
        step(this._world);
        return true;
    }
}

export function newServer(): Server {
    return new ServerImpl();
}
