// Author: Kaura Peura

/**
 * @module
 * Error handling for the engine.
 */

export function reportError(err: Error, data: any) {
    console.error(err, JSON.stringify(data, null, 2));
}
