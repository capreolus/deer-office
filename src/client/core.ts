// Author: Kaura Peura

/**
 * @module
 * The game client.
 */

import { newDisplay, Display } from './display/core';
import { ComponentMemory } from '../engine/component';
import { visualize } from './visualize';

const Constants = {
    DefaultTileSetUrl: 'assets/ibm_8x14.png',
    DefaultTileSetWidth: 16,
    DefaultTileSetHeight: 16,
    DisplayWidthInTiles: 48,
    DisplayHeightInTiles: 16,
} as const;

export interface ClientEventHandlers {
    readonly onRequestNewWorld: () => Promise<void>
    readonly onRequestPlayerMemory: () => Promise<ComponentMemory|null>
}

export interface Client {
    readonly canvas: HTMLCanvasElement
}

class ClientImpl implements Client {
    private readonly _display: Display;
    private readonly _eventHandlers: ClientEventHandlers;

    readonly canvas: HTMLCanvasElement

    constructor (eventHandlers: ClientEventHandlers) {
        this._display = newDisplay();
        this._eventHandlers = eventHandlers;
        this.canvas = this._display.canvas;

        (async () => {
            try {
                await eventHandlers.onRequestNewWorld();
                await this.setTileSet(Constants.DefaultTileSetUrl, Constants.DefaultTileSetWidth, Constants.DefaultTileSetHeight);
            } catch (err) {
                console.error(err);
            }
        })();
    }

    private async _paint() {
        const memory = await this._eventHandlers.onRequestPlayerMemory();
        if (memory != null) {
            window.requestAnimationFrame(() => {
                const [tileWidth, tileHeight] = this._display.tileSize('default');
                const displayList = visualize(memory, tileWidth, tileHeight);
                this._display.clear(0.0, 0.0, 0.0, 1.0);
                this._display.drawSprites('default', displayList);
            });
        }
    }

    async setTileSet(url: string, horzTileCount: number, vertTileCount: number): Promise<void> {
        await this._display.setTileSet('default', url, horzTileCount, vertTileCount);

        const [tileWidth, tileHeight] = this._display.tileSize('default');
        this._display.resize(
            Constants.DisplayWidthInTiles * tileWidth,
            Constants.DisplayHeightInTiles * tileHeight
        );

        await this._paint();
    }

}

export function newClient(eventHandlers: ClientEventHandlers): Client {
    return new ClientImpl(eventHandlers);
}
