// Author: Kaura Peura

/**
 * @module
 * Cell geometry and ray casting.
 */

import { reportError } from './error';
import { cloneVec3, diffVec3, dotVec3, floorVec3, greatestDivisor, isEqualVec3, newVec3, prodVec3XYZ, quotVec3XYZ, ReadonlyVec3, sumVec3, Vec3 } from './math';

const Constants = {
    MaxDelta: 256,
    PackOffset: 512,
    PackScalar: 1024,
} as const;

function pack(v: Vec3): number {
    return (
        (v[0] + Constants.PackOffset) +
        (v[1] + Constants.PackOffset) * Constants.PackScalar +
        (v[2] + Constants.PackOffset) * Constants.PackScalar * Constants.PackScalar
    );
}

function packXYZ(x: number, y: number, z: number): number {
    return (
        (x + Constants.PackOffset) +
        (y + Constants.PackOffset) * Constants.PackScalar +
        (z + Constants.PackOffset) * Constants.PackScalar * Constants.PackScalar
    );
}

function unpack(i: number): Vec3 {
    return newVec3(
        i % Constants.PackScalar - Constants.PackOffset,
        Math.floor(i / Constants.PackScalar) % Constants.PackScalar - Constants.PackOffset,
        Math.floor(i / Constants.PackScalar / Constants.PackScalar) % Constants.PackScalar - Constants.PackOffset,
    )
}

export function radiusToCellCoordinates(r: number, xMax: number, yMax: number, zMax: number): Vec3[] {
    const output: Vec3[] = [];
    const rx = Math.min(xMax, r);
    const ry = Math.min(yMax, r);
    const rz = Math.min(zMax, r);
    const s = Math.max(3, r * r + 1);

    for (let z = -rz; z <= rz; z++) {
        for (let y = -ry; y <= ry; y++) {
            for (let x = -rx; x <= rx; x++) {
                if (x * x + y * y + z * z <= s) {
                    output.push(newVec3(x, y, z));
                }
            }
        }
    }

    return output;
}

function filterRayTargets(origo: ReadonlyVec3, targets: ReadonlyVec3[]): Vec3[] {
    const indexToEntry: Map<number, ReadonlyVec3> = new Map();

    for (let v of targets) {
        const delta = diffVec3(v, origo);
        const div = greatestDivisor(delta);
        const index = pack(quotVec3XYZ(delta, div, div, div));
        const sqr = dotVec3(delta, delta);

        if (!indexToEntry.has(index)) {
            indexToEntry.set(index, v);
        } else {
            const known = indexToEntry.get(index)!;
            const knownDelta = diffVec3(known, origo);
            const knownSqr = dotVec3(knownDelta, knownDelta);
            if (knownSqr < sqr) { indexToEntry.set(index, v); }
        }
    }

    return [...indexToEntry.values()].map(v => cloneVec3(v));
}

/**
 * Casts a ray from one point to another and returns a list of all voxels intersected on the way. A ray is considered
 * to intersect a voxel by the algorithm if the ray intersects the interior set of the voxel, that is, intersections
 * with a faces, edges or corner are not considered true intersections.
 *
 * @param out The output buffer where to write the ray as a flat list of consecutive x, y and z coordinate tuples.
 * @param a The ray origo.
 * @param b The ray target.
 * @param scale The relative voxel size.
 */
export function cast(out: number[], a: ReadonlyVec3, b: ReadonlyVec3, scale: number) {
    if (isEqualVec3(a, b)) {
        return;
    }

    const [xDelta, yDelta, zDelta] = diffVec3(b, a);

    // Only the magnitude of the delta is considered when stepping the ray to reduce the number of special cases.
    const xStep = Math.abs(xDelta);
    const yStep = Math.abs(yDelta);
    const zStep = Math.abs(zDelta);

    if (
        xStep >= Constants.MaxDelta ||
        yStep >= Constants.MaxDelta ||
        zStep >= Constants.MaxDelta
    ) {
        reportError(  new Error(`A cast ray delta exceeds the maximum length of ${Constants.MaxDelta}`), { a, b, scale }, );
        return;
    }

    // The fixed point unit value is chosen to be divisible by all non-zero step lengths as to ensure that the ray
    // steps align with the voxel boundaries. This reduces the number of special cases to consider.
    const unit = Math.max(xStep, 1) * Math.max(yStep, 1) * Math.max(zStep, 1);
    const voxelSize = unit * scale;

    let [ax, ay, az] = prodVec3XYZ(a, unit, unit, unit);

    if (
        xStep === 0 && ax % voxelSize === 0 ||
        yStep === 0 && ay % voxelSize === 0 ||
        zStep === 0 && az % voxelSize === 0
    ) {
        // Oopsie-woopsie we're locked onto one or more of the grid planes and can never intersect a voxel.
        return 0;
    }

    if (xDelta < 0) { ax = -ax; }
    if (yDelta < 0) { ay = -ay; }
    if (zDelta < 0) { az = -az; }

    const xMod = xDelta < 0 ? -1 : 1;
    const yMod = yDelta < 0 ? -1 : 1;
    const zMod = zDelta < 0 ? -1 : 1;

    let rx = ax < 0 ? ax % voxelSize + voxelSize : ax % voxelSize;
    let ry = ay < 0 ? ay % voxelSize + voxelSize : ay % voxelSize;
    let rz = az < 0 ? az % voxelSize + voxelSize : az % voxelSize;

    const rxMax = rx + unit * xStep;
    const ryMax = ry + unit * yStep;
    const rzMax = rz + unit * zStep;

    const [xOffset, yOffset, zOffset] = floorVec3(quotVec3XYZ(a, scale, scale, scale));

    while (rx < rxMax || ry < ryMax || rz < rzMax) {
        out.push(xOffset + xMod * Math.floor(rx / voxelSize));
        out.push(yOffset + yMod * Math.floor(ry / voxelSize));
        out.push(zOffset + zMod * Math.floor(rz / voxelSize));

        const multiplier = Math.min(
            (voxelSize - rx % voxelSize) / xStep,
            (voxelSize - ry % voxelSize) / yStep,
            (voxelSize - rz % voxelSize) / zStep,
        );

        rx += multiplier * xStep;
        ry += multiplier * yStep;
        rz += multiplier * zStep;
    }
}

export interface RayCaster {
    cast(output: Uint8Array, target: Uint8Array, size: ReadonlyVec3, origo: ReadonlyVec3, writeMask: number, readMask: number): void;
}

class RayCasterImpl implements RayCaster {
    private _rays: Int32Array = new Int32Array();
    private _limits: Int32Array = new Int32Array();

    constructor (radius: number, xMax: number, yMax: number, zMax: number) {
        const origo = newVec3(1, 1, 1);
        const cells = radiusToCellCoordinates(radius, xMax, yMax, zMax);
        const transformed = cells.map(v => sumVec3(prodVec3XYZ(v, 2, 2, 2), origo));
        const unique = filterRayTargets(origo, transformed);

        const rays: number[] = [];
        const limits: number[] = [];

        for (let v of unique) {
            cast(rays, origo, v, 2);
            limits.push(rays.length);
        }

        this._rays = new Int32Array(rays);
        this._limits = new Int32Array(limits);
    }

    cast(output: Uint8Array, target: Uint8Array, size: ReadonlyVec3, origo: ReadonlyVec3, writeMask: number, readMask: number): void {
        const [xLimit, yLimit, zLimit] = size;
        const [xOrigo, yOrigo, zOrigo] = origo;
        const xyLimit = xLimit * yLimit;
        const limits = this._limits;
        const rays = this._rays;
        const n = rays.length;

        let rayPtr = 0;
        let next = limits[rayPtr];

        for (let i = 0; i < n; i += 3) {
            while (i >= next) {
                rayPtr++;
                next = rayPtr < limits.length ? limits[rayPtr] : n;
            }

            const x = xOrigo + rays[i + 0];
            if (x < 0 || x >= xLimit) {
                i = next;
                continue;
            }

            const y = yOrigo + rays[i + 1];
            if (y < 0 || y >= yLimit) {
                i = next;
                continue;
            }

            const z = zOrigo + rays[i + 2];
            if (z < 0 || z >= zLimit) {
                i = next;
                continue;
            }

            const cellPtr = x + y * xLimit + z * xyLimit;
            output[x + y * xLimit + z * xyLimit] |= writeMask;
            if ((target[cellPtr] & readMask) !== 0) {
                i = next;
            }
        }
    }
}

export function newRayCaster(radius: number, xMax: number, yMax: number, zMax: number): RayCaster {
    return new RayCasterImpl(radius, xMax, yMax, zMax);
}
