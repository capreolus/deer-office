// Author: Kaura Peura

/**
 * @module
 * Math types and utilities for the game engine.
 */

export type Vec3 = [number, number, number];
export type ReadonlyVec3 = readonly [number, number, number];

export function newVec3(x: number = 0, y: number = 0, z: number = 0): Vec3 {
    return [x, y, z];
}

export function cloneVec3(v: ReadonlyVec3): Vec3 {
    return newVec3(v[0], v[1], v[2]);
}

export function copyVec3(target: Vec3, v: ReadonlyVec3) {
    target[0] = v[0];
    target[1] = v[1];
    target[2] = v[2];
}

export function copyVec3XYZ(target: Vec3, x: number, y: number, z: number) {
    target[0] = x;
    target[1] = y;
    target[2] = z;
}

export function isEqualVec3(a: ReadonlyVec3, b: ReadonlyVec3): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
}

export function isEqualVec3XYZ(a: ReadonlyVec3, x: number, y: number, z: number): boolean {
    return a[0] === x && a[1] === y && a[2] === z;
}

export function isNullVec3(v: ReadonlyVec3): boolean {
    return v[0] === 0 && v[1] === 0 && v[2] === 0;
}

export function sumVec3(a: ReadonlyVec3, b: ReadonlyVec3): Vec3 {
    return newVec3(
        a[0] + b[0],
        a[1] + b[1],
        a[2] + b[2],
    );
}

export function sumVec3XYZ(v: ReadonlyVec3, x: number, y: number, z: number): Vec3 {
    return newVec3(
        v[0] + x,
        v[1] + y,
        v[2] + z,
    );
}

export function diffVec3(a: ReadonlyVec3, b: ReadonlyVec3): Vec3 {
    return newVec3(
        a[0] - b[0],
        a[1] - b[1],
        a[2] - b[2],
    );
}

export function diffVec3XYZ(v: ReadonlyVec3, x: number, y: number, z: number): Vec3 {
    return newVec3(
        v[0] - x,
        v[1] - y,
        v[2] - z,
    );
}

export function prodVec3(a: ReadonlyVec3, b: ReadonlyVec3): Vec3 {
    return newVec3(
        a[0] * b[0],
        a[1] * b[1],
        a[2] * b[2],
    );
}

export function prodVec3XYZ(v: ReadonlyVec3, x: number, y: number, z: number): Vec3 {
    return newVec3(
        v[0] * x,
        v[1] * y,
        v[2] * z,
    );
}

export function quotVec3(a: ReadonlyVec3, b: ReadonlyVec3): Vec3 {
    return newVec3(
        a[0] / b[0],
        a[1] / b[1],
        a[2] / b[2],
    );
}

export function quotVec3XYZ(v: ReadonlyVec3, x: number, y: number, z: number): Vec3 {
    return newVec3(
        v[0] / x,
        v[1] / y,
        v[2] / z,
    );
}

export function maxVec3(a: ReadonlyVec3, b: ReadonlyVec3): Vec3 {
    return newVec3(
        Math.max(a[0], b[0]),
        Math.max(a[1], b[1]),
        Math.max(a[2], b[2]),
    );
}

export function minVec3(a: ReadonlyVec3, b: ReadonlyVec3): Vec3 {
    return newVec3(
        Math.min(a[0], b[0]),
        Math.min(a[1], b[1]),
        Math.min(a[2], b[2]),
    );
}

export function floorVec3(v: ReadonlyVec3): Vec3 {
    return newVec3(
        Math.floor(v[0]),
        Math.floor(v[1]),
        Math.floor(v[2]),
    )
}

export function ceilVec3(v: ReadonlyVec3): Vec3 {
    return newVec3(
        Math.ceil(v[0]),
        Math.ceil(v[1]),
        Math.ceil(v[2]),
    )
}

export function isInsideVec3(v: ReadonlyVec3, min: ReadonlyVec3, max: ReadonlyVec3): boolean {
    return (
        min[0] <= v[0] && v[0] <= max[0] &&
        min[1] <= v[1] && v[1] <= max[1] &&
        min[2] <= v[2] && v[2] <= max[2]
    );
}

export function volume(v: ReadonlyVec3): number {
    return v[0] * v[1] * v[2];
}
