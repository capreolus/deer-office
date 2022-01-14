// Author: Kaura Peura

/**
 * @module
 * The definitions for actions the game actors can take.
 */

import { Direction2D } from './direction';

export interface ActionNone {
    readonly tag: 'action-none'
}

export function newActionNone(): ActionNone {
    return { tag: 'action-none' }
}

export interface ActionWalk {
    readonly tag: 'action-walk'
    readonly dir: Direction2D
}

export function newActionWalk(dir: Direction2D): ActionWalk {
    return {
        tag: 'action-walk',
        dir,
    };
}
export type Action =
    ActionNone |
    ActionWalk;
