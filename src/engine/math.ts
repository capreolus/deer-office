// Author: Kaura Peura

/**
 * @module
 * Math types and utilities for the game engine.
 */

export type Vec2 = [number, number];
export type Vec3 = [number, number, number];

export function newVec2(x: number= 0, y: number = 0): Vec2 {
    return [x, y];
}

export function newVec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
    return [x, y, z];
}

export function clone<T extends number[]>(v: T): T {
    return v.slice() as T;
}
