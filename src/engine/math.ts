// Author: Kaura Peura

/**
 * @module
 * Math types and utilities for the game engine.
 */

export type Vec3 = [number, number, number];

export function newVec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
    return [x, y, z];
}

export function addVec3(out: Vec3, v: Vec3): Vec3 {
    out[0] += v[0];
    out[1] += v[1];
    out[2] += v[2];
    return out;
}

export function clone<T extends number[]>(v: T): T {
    return v.slice() as T;
}
