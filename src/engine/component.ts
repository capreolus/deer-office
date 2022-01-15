// Author: Kaura Peura

/**
 * @module
 * The ECS components for the game engine
 */

import { Action, newActionNone } from './action';
import { VisualType } from './appearance';
import { Impression } from './impression';
import { newVec3, Vec3 } from './math';

export interface ComponentActor {
    nextAction: Action
}

export function newComponentActor() {
    return { nextAction: newActionNone() };
}

export interface ComponentAppearance {
    visualType: VisualType
}

export function newComponentAppearance(visualType = VisualType.Unknown): ComponentAppearance {
    return { visualType };
}

export interface ComponentMemory {
    readonly entities: Map<number, Impression>;
    position: Vec3
    areaSize: Vec3
}

export function newComponentMemory(): ComponentMemory {
    return {
        entities: new Map(),
        position: newVec3(),
        areaSize: newVec3(),
    };
}

export type ComponentPosition = Vec3;

export function newComponentPosition(): ComponentPosition {
    return newVec3();
}
