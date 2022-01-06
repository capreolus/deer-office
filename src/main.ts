// Author: Kaura Peura

/**
 * @module
 * A deer themed roguelike.
 */

import { newDisplay } from './display';
import { testDisplayList } from './test';

const Constants = {
    DisplayWidthInTiles: 48,
    DisplayHeightInTiles: 16,
} as const;

(async () => {
    try {
        const display = newDisplay();
        await display.setTileSet('default', 'assets/ibm_8x14.png', 16, 16);
        const [tileWidth, tileHeight] = display.tileSize('default');

        display.resize(
            Constants.DisplayWidthInTiles * tileWidth,
            Constants.DisplayHeightInTiles * tileHeight
        );

        document
            .getElementById('display-container')!
            .appendChild(display.canvas);

        const displayList = testDisplayList(
            tileWidth,
            tileHeight,
            Constants.DisplayWidthInTiles,
            Constants.DisplayHeightInTiles
        );

        const paint = () => {
            display.clear(0.0, 0.0, 0.1, 1.0);
            display.drawSprites('default', displayList);
            window.requestAnimationFrame(paint);
        }

        window.requestAnimationFrame(paint);
    } catch (err) {
        console.error('Unhandled error:', err);
    }
})();
