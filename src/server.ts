// Author: Kaura Peura

/**
 * @module
 * The game server.
 */

const Constants = {
    WorldWidth: 100,
    WorldHeight: 10,
} as const;

import { Action } from './engine/action';
import { ComponentMemory } from './engine/component';
import { step } from './engine/core';
import { World } from './engine/world';
import { generateWorld } from './game';

export interface Server {
    commandGenerateWorld(): void
    commandGetPlayerMemory(): ComponentMemory|null
    commandNextPlayerAction(action: Action): void
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

    commandNextPlayerAction(action: Action): void {
        if (this._world == null) { return; }
        const players = this._world.findPlayers();
        if (players.length < 1) { return; }
        players[0].actor.nextAction = action;
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
