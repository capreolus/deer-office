// Author: Kaura Peura

/**
 * @module
 * The predefined entity types for the ECS.
 */

import { ComponentActor, ComponentAppearance, ComponentCollision, ComponentMemory, ComponentPosition } from './component';

export interface EntityComponents {
    readonly actor: ComponentActor|null
    readonly appearance: ComponentAppearance|null
    readonly collision: ComponentCollision|null
    readonly memory: ComponentMemory|null
    readonly position: ComponentPosition|null
}

export interface Entity extends EntityComponents {
    readonly id: number
}

export type EntityPhysical = Entity & {
    readonly collision: ComponentCollision
    readonly position: ComponentPosition
};

export function isEntityPhysical(e: Entity): e is EntityPhysical {
    return e.collision != null && e.position != null;
}

export type EntityPlayer = Entity & {
    readonly actor: ComponentActor
    readonly memory: ComponentMemory
    readonly position: ComponentPosition
};

export function isEntityPlayer(e: Entity): e is EntityPlayer {
    return e.actor != null && e.memory != null && e.position != null;
}

export type EntityPositioned = Entity & {
    readonly position: ComponentPosition
}

export function isEntityPositioned(e: Entity): e is EntityPositioned {
    return e.position != null;
}

export type EntityVisible = Entity & {
    readonly appearance: ComponentAppearance
    readonly position: ComponentPosition
};

export function isEntityVisible(e: Entity): e is EntityVisible {
    return e.appearance != null && e.position != null;
}
