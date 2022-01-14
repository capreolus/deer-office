// Author: Kaura Peura

/**
 * @module
 * The impression type for player memory.
 */

import { VisualType } from './appearance';
import { Vec3 } from './math';

export interface Impression {
    readonly id: number
    time: number
    position: Vec3
    visualType: VisualType
}
