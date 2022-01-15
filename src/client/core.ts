// Author: Kaura Peura

/**
 * @module
 * The game client.
 */

import { newDisplay, Display } from './display/core';
import { ComponentMemory } from '../engine/component';
import { visualize } from './visualize';
import { Action, newActionWalk } from '../engine/action';
import { Direction2D } from '../engine/direction';

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
    readonly onNextPlayerAction: (action: Action) => Promise<void>
    readonly onStepWorld: () => Promise<void>
}

export interface Client {
    readonly canvas: HTMLCanvasElement
}

class ClientImpl implements Client {
    private readonly _display: Display;
    private readonly _eventHandlers: ClientEventHandlers;
    private _isBusy: boolean = true;

    readonly canvas: HTMLCanvasElement

    constructor (eventHandlers: ClientEventHandlers) {
        this._display = newDisplay();
        this._eventHandlers = eventHandlers;
        this.canvas = this._display.canvas;

        document.addEventListener('keydown', this._onKeyDown);

        (async () => {
            try {
                await eventHandlers.onRequestNewWorld();
                await this.setTileSet(Constants.DefaultTileSetUrl, Constants.DefaultTileSetWidth, Constants.DefaultTileSetHeight);
            } catch (err) {
                console.error('Client error:', err);
            }

            this._isBusy = false;
        })();
    }

    private readonly _onKeyDown = (e: KeyboardEvent) => {
        if (this._isBusy) { return; }
        this._isBusy = true;

        let action: Action|null = null;

        switch (e.key) {
            case '8':
            case 'ArrowUp': {
                action = newActionWalk(Direction2D.North);
                break;
            }

            case '7':
            case 'Home': {
                action = newActionWalk(Direction2D.NorthWest);
                break;
            }

            case '4':
            case 'ArrowLeft': {
                action = newActionWalk(Direction2D.West);
                break;
            }

            case '1':
            case 'End': {
                action = newActionWalk(Direction2D.SouthWest);
                break;
            }

            case '2':
            case 'ArrowDown': {
                action = newActionWalk(Direction2D.South);
                break;
            }

            case '3':
            case 'PageDown': {
                action = newActionWalk(Direction2D.SouthEast);
                break;
            }

            case '6':
            case 'ArrowRight': {
                action = newActionWalk(Direction2D.East);
                break;
            }

            case '9':
            case 'PageUp': {
                action = newActionWalk(Direction2D.NorthEast);
                break;
            }
        }

        if (action != null) {
            (async () => {
                try {
                    await this._eventHandlers.onNextPlayerAction(action);
                    await this._eventHandlers.onStepWorld();
                    await this._paint();
                } catch (err) {
                    console.log('Error executing next player action:', err);
                }

                this._isBusy = false;
            })();

        } else {
            this._isBusy = false;
        }
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
