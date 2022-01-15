// Author: Kaura Peura

/**
 * @module
 * Utility types for working with directions.
 */

import { newVec3, Vec3 } from './math';

export enum Direction2D {
    East,
    NorthEast,
    North,
    NorthWest,
    West,
    SouthWest,
    South,
    SouthEast,
}

export function delta(dir: Direction2D): Vec3 {
    switch (dir) {
        case Direction2D.East: return newVec3(1, 0);
        case Direction2D.NorthEast: return newVec3(1, 1);
        case Direction2D.North: return newVec3(0, 1);
        case Direction2D.NorthWest: return newVec3(-1, 1);
        case Direction2D.West: return newVec3(-1, 0);
        case Direction2D.SouthWest: return newVec3(-1, -1);
        case Direction2D.South: return newVec3(0, -1);
        case Direction2D.SouthEast: return newVec3(1, -1);
    }
}
