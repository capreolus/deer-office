// Author: Kaura Peura

/**
 * @module
 * An utility for observing changes in device pixel ratio.
 */

const Local: {
    readonly listeners: Set<() => void>
} = {
    listeners: new Set()
};

export function addDevicePixelRatioChangeListener(fn: () => void) { Local.listeners.add(fn); }
export function removeDevicePixelRatioChangeListener(fn: () => void) { Local.listeners.delete(fn); }

(() => {
    const update = () => {
        for (let fn of Local.listeners) { fn(); }
        matchMedia(`(resolution: ${window.devicePixelRatio}dppx)`).addEventListener('change', update, { once: true });
    };

    update();
})();
