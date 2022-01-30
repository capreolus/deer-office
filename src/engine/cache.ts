// Author: Kaura Peura

/**
 * @module
 * The implementation for world cache.
 */

import { EntityPositioned, isEntityPhysical, isEntityPositioned } from './entity';
import { reportError } from './error';
import { newRayCaster, RayCaster } from './geometry';
import { ceilVec3, cloneVec3, diffVec3XYZ, isEqualVec3, isInsideVec3, minVec3, newVec3, prodVec3XYZ, quotVec3XYZ, ReadonlyVec3, sumVec3XYZ, Vec3, volume } from './math';
import { Shape } from './shape';
import { World } from './world';

const Constants = {
    ChunkWidth: 4,
    ChunkHeight: 4,
    ChunkDepth: 1,
} as const;

export enum CellFlag {
    Empty = 0,
    FilledPhysical = 1,
    FilledLight = 2,
};

export interface SpatialCacheData {
    readonly cells: Uint8Array
    readonly size: Vec3
}

export interface SpatialCache {
    data(): SpatialCacheData
    rebuild(world: World): void
    cellFlags(position: ReadonlyVec3): number
    entityMoved(entity: EntityPositioned, oldPosition: ReadonlyVec3): void
}

interface Chunk {
    readonly entities: EntityPositioned[]
    readonly origo: ReadonlyVec3
    readonly limit: ReadonlyVec3
}

export class SpatialCacheImpl implements SpatialCache {
    private _sizeCells: ReadonlyVec3 = newVec3();
    private _xStrideCells: number = 0;
    private _xyStrideCells: number = 0;
    private _cellBoundsMin: ReadonlyVec3 = newVec3();
    private _cellBoundsMax: ReadonlyVec3 = newVec3();
    private _cells: Uint8Array = new Uint8Array();

    private _xStrideChunks: number = 0;
    private _xyStrideChunks: number = 0;
    private _chunks: Chunk[] = [];

    private _chunkIndexFromCellPosition(position: ReadonlyVec3): number {
        return (
            Math.floor(position[0] / Constants.ChunkWidth) +
            Math.floor(position[1] / Constants.ChunkHeight) * this._xStrideChunks +
            Math.floor(position[2] / Constants.ChunkDepth) * this._xyStrideChunks
        );
    }

    private _updateCellsByChunkIndex(chunkIndex: number): void {
        const cells = this._cells;
        const xStrideCells = this._xStrideCells;
        const xyStrideCells = this._xyStrideCells;

        const chunk = this._chunks[chunkIndex];
        const [xOrigo, yOrigo, zOrigo] = chunk.origo;
        const [xLimit, yLimit, zLimit] = chunk.limit;

        for (let z = zOrigo; z < zLimit; z++) {
            for (let y = yOrigo; y < yLimit; y++) {
                for (let x = xOrigo; x < xLimit; x++) {
                    cells[x + y * xStrideCells + z * xyStrideCells] = 0;
                }
            }
        }

        for (const entity of chunk.entities) {
            if (!isEntityPhysical(entity)) {
                continue;
            }

            const flags =
                (entity.collision.light === Shape.Filled ? CellFlag.FilledLight : 0) |
                (entity.collision.physical === Shape.Filled ? CellFlag.FilledPhysical : 0);

            if (flags === 0) {
                continue;
            }

            const [x, y, z] = entity.position;
            cells[x + y * xStrideCells + z * xyStrideCells] |= flags;
        }
    }

    data(): SpatialCacheData {
        return {
            cells: this._cells,
            size: cloneVec3(this._sizeCells),
        };
    }

    rebuild(world: World) {
        const sizeCells = world.size();
        const [xChunks, yChunks, zChunks] = ceilVec3(quotVec3XYZ(sizeCells, Constants.ChunkWidth, Constants.ChunkHeight, Constants.ChunkDepth));

        this._sizeCells = sizeCells;
        this._xStrideCells = sizeCells[0];
        this._xyStrideCells = sizeCells[0] * sizeCells[1];
        this._cellBoundsMin = world.boundsMin();
        this._cellBoundsMax = world.boundsMax();
        this._cells = new Uint8Array(volume(sizeCells));

        this._xStrideChunks = xChunks;
        this._xyStrideChunks = xChunks * yChunks;
        this._chunks = [];

        for (let z = 0; z < zChunks; z++) {
            for (let y = 0; y < yChunks; y++) {
                for (let x = 0; x < xChunks; x++) {
                    const entities: EntityPositioned[] = [];
                    const origo = prodVec3XYZ(newVec3(x, y, z), Constants.ChunkWidth, Constants.ChunkHeight, Constants.ChunkDepth);
                    const limit = minVec3(sizeCells, sumVec3XYZ(origo, Constants.ChunkWidth, Constants.ChunkHeight, Constants.ChunkDepth));
                    this._chunks.push({ entities, origo, limit });
                }
            }
        }

        for (let e of world.entities()) {
            if (!isEntityPositioned(e)) { continue; }
            const index = this._chunkIndexFromCellPosition(e.position);
            this._chunks[index].entities.push(e);
        }

        for (let i = 0; i < this._chunks.length; i++) {
            this._updateCellsByChunkIndex(i);
        }
    }

    cellFlags(position: ReadonlyVec3): number {
        if (!isInsideVec3(position, this._cellBoundsMin, this._cellBoundsMax)) {
            const errorData = { position, cellBoundsMin: this._cellBoundsMin, cellBoundsMax: this._cellBoundsMax };
            reportError(new Error('Tried accessing cell flags out of bounds'), errorData);
            return 0;
        }

        const [x, y, z] = position;
        return this._cells[x + this._xStrideCells * y + this._xyStrideCells * z];
    }

    entityMoved(entity: EntityPositioned, oldPosition: ReadonlyVec3): void {
        if (!isInsideVec3(oldPosition, this._cellBoundsMin, this._cellBoundsMax)) {
            const errorData = { oldPosition, cellBoundsMin: this._cellBoundsMin, cellBoundsMax: this._cellBoundsMax };
            reportError(new Error('Invalid old position while moving entity'), errorData);
            return;
        }

        if (!isInsideVec3(entity.position, this._cellBoundsMin, this._cellBoundsMax)) {
            const errorData = { oldPosition, cellBoundsMin: this._cellBoundsMin, cellBoundsMax: this._cellBoundsMax }
            reportError(new Error('Invalid new position while moving entity'), errorData);
            return;
        }

        const oldChunkIndex = this._chunkIndexFromCellPosition(oldPosition);
        const newChunkIndex = this._chunkIndexFromCellPosition(entity.position);

        if (oldChunkIndex === newChunkIndex) {
            this._updateCellsByChunkIndex(newChunkIndex);
        } else {
            const oldChunkEntities = this._chunks[oldChunkIndex].entities;
            const indexInOld = oldChunkEntities.findIndex(e => e.id === entity.id);

            if (indexInOld === -1) {
                const errorData = { entity, oldPosition, oldChunk: this._chunks[oldChunkIndex] };
                reportError(new Error(`Failed to find moved entity ${entity.id} in old chunk index ${oldChunkIndex}`), errorData);
                return;
            }

            oldChunkEntities[indexInOld] = oldChunkEntities[oldChunkEntities.length - 1];
            oldChunkEntities.pop();

            this._chunks[newChunkIndex].entities.push(entity);
            this._updateCellsByChunkIndex(oldChunkIndex);
            this._updateCellsByChunkIndex(newChunkIndex);
        }
    }
}

export function newSpatialCache(): SpatialCache {
    return new SpatialCacheImpl();
}

export interface FieldOfViewCache {
    update(origo: ReadonlyVec3, radius: number, spatialCache: SpatialCache): void
    isVisible(v: ReadonlyVec3): boolean
    rebuild(world: World): void
}

class FieldOfViewCacheImpl implements FieldOfViewCache {
    private _buffer: Uint8Array = new Uint8Array;
    private _size: ReadonlyVec3 = newVec3();
    private _boundsMin: ReadonlyVec3 = newVec3();
    private _boundsMax: ReadonlyVec3 = newVec3();
    private _xStride: number = 0;
    private _xyStride: number = 0;

    private readonly _paramsToRayCastingCache: Map<string, RayCaster> = new Map();

    update(origo: ReadonlyVec3, radius: number, spatialCache: SpatialCache): void {
        if (!isInsideVec3(origo, this._boundsMin, this._boundsMax)) {
            const errorData = { origo, boundsMin: this._boundsMin, boundsMax: this._boundsMax };
            reportError(new Error('Tried updating field of view cache with origo out of bounds'), errorData);
            return;
        }

        const spatialData = spatialCache.data();
        if (!isEqualVec3(spatialData.size, this._size)) {
            const errorData = { fieldOfViewCacheSize: this._size, spatialCacheSize: spatialData.size };
            reportError(new Error('Field of view cache size doesn\'t match that of the spatial cache'), errorData);
            return;
        }

        const [xMax, yMax, zMax] = diffVec3XYZ(this._size, 1, 1, 1);
        const params = `${radius}:${xMax}:${yMax}:${zMax}`;
        if (!this._paramsToRayCastingCache.has(params)) {
            this._paramsToRayCastingCache.set(params, newRayCaster(radius, xMax, yMax, zMax));
        }

        this._buffer.fill(0);
        const rayCaster = this._paramsToRayCastingCache.get(params)!;
        rayCaster.cast(this._buffer, spatialData.cells, this._size, origo, 1, CellFlag.FilledLight);
    }

    isVisible(position: ReadonlyVec3): boolean {
        if (!isInsideVec3(position, this._boundsMin, this._boundsMax)) {
            const errorData = { position, cellBoundsMin: this._boundsMin, cellBoundsMax: this._boundsMax };
            reportError(new Error('Tried testing visibility out of bounds'), errorData);
            return false;
        }

        return this._buffer[
            position[0] +
            position[1] * this._xStride +
            position[2] * this._xyStride
        ] !== 0;
    }

    rebuild(world: World): void {
        this._size = world.size();
        this._xStride = this._size[0];
        this._xyStride = this._size[0] * this._size[1];
        this._boundsMin = world.boundsMin();
        this._boundsMax = world.boundsMax();
        this._buffer = new Uint8Array(volume(this._size));
    }
}

export function newFieldOfViewCache(): FieldOfViewCache {
    return new FieldOfViewCacheImpl();
}

export interface Cache {
    readonly spatial: SpatialCache,
    readonly fieldOfView: FieldOfViewCache
}

export function newCache(): Cache {
    return {
        spatial: newSpatialCache(),
        fieldOfView: newFieldOfViewCache(),
    };
}
