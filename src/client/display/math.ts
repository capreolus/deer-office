// Author: Kaura Peura

/**
 * @module
 * Math utilities.
 */

export function orthoProjection(left: number, right: number, bottom: number, top: number, far: number, near: number) {
    const leftRight = right - left;
    const bottomTop = top - bottom;
    const farNear = near - far;

    return [
        2.0 / leftRight,
        0.0,
        0.0,
        0.0,

        0.0,
        2.0 / bottomTop,
        0.0,
        0.0,

        0.0,
        0.0,
        2.0 / farNear,
        0.0,

        -(left + right) / leftRight,
        -(bottom + top) / bottomTop,
        (far + near) / farNear,
        1.0
    ];
}
