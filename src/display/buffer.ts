// Author: Kaura Peura

/**
 * @module
 * Data and storage related utilities.
 */

const Constants = {
    InitialVectorSize: 16
} as const;

export interface Float32Vector {
    array(): Float32Array;
    length(): number
    clear(): void;
    push(x: number): void;
}

class Float32VectorImpl implements Float32Vector {
    private _array: Float32Array = new Float32Array(Constants.InitialVectorSize);
    private _capacity: number = Constants.InitialVectorSize;
    private _length: number = Constants.InitialVectorSize;

    array(): Float32Array {
        return this._array;
    }

    length(): number {
        return this._length;
    }

    clear(): void {
        this._length = 0;
    }

    push(x: number): void {
        if (this._length >= this._capacity) {
            const newCapacity = this._capacity * 2;
            const newArray = new Float32Array(newCapacity);
            this._capacity = newCapacity;
            newArray.set(this._array);
            this._array = newArray;
        }

        this._array[this._length] = x;
        this._length++;
    }
}

export function newFloat32Vector(): Float32Vector {
    return new Float32VectorImpl();
}
