// Author: Kaura Peura

/**
 * @module
 * A deer themed roguelike.
 */

import { newClient } from './client/core';
import { Action } from './engine/action';
import { newServer } from './server';

const server = newServer();
const client = newClient({
    onRequestNewWorld: () => {
        server.commandGenerateWorld();
        return Promise.resolve();
    },

    onRequestPlayerMemory: () => {
        return Promise.resolve(server.commandGetPlayerMemory());
    },

    onNextPlayerAction: (action: Action) => {
        server.commandNextPlayerAction(action);
        return Promise.resolve();
    },

    onStepWorld: () => {
        server.commandStepGame();
        return Promise.resolve();
    }
});

document
    .getElementById('display-container')!
    .appendChild(client.canvas);
