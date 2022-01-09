// Author: Kaura Peura

/**
 * @module
 * Image utilities.
 */

export function imageBitmapFromURL(url: string): Promise<ImageBitmap> {
    return new Promise((resolve, reject) => {
        try {
            const image = new Image();
            image.addEventListener('error', (e: ErrorEvent) => { reject(new Error(e.message)); });
            image.addEventListener('load', () => { resolve(createImageBitmap(image)); });
            image.src = url;
        } catch (err) {
            reject(err);
        }
    });
}
