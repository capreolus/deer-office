// Author: Kaura Peura

/**
 * @module
 * A deer themed roguelike.
 */

import { newClient } from './client/core';
import { newServer } from './server';

const server = newServer();
const client = newClient({
    onRequestNewWorld: () => {
        server.commandGenerateWorld();
        return Promise.resolve();
    },

    onRequestPlayerMemory: () => {
        return Promise.resolve(server.commandGetPlayerMemory());
    }
});

document
    .getElementById('display-container')!
    .appendChild(client.canvas);
