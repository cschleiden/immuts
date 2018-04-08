/**
 * Clone and push elements into array
 * @param array Source array
 * @param values Values to push
 */
export function push<T>(array: ReadonlyArray<T>, ...values: T[]): ReadonlyArray<T> {
    return [
        ...array,
        ...values
    ];
}

/**
 * Clone and remove last element from array
 * @param array Source array
 */
export function pop<T>(array: ReadonlyArray<T>): ReadonlyArray<T> {
    return array.slice(0, -1);
}

/**
 * Clone and delete/insert items into array
 * @param array Source array
 * @param start Start index
 * @param deleteCount Number of items to delete
 * @param items Items to insert insert
 */
export function splice<T>(array: ReadonlyArray<T>, start: number, deleteCount: number, ...items: T[]): ReadonlyArray<T> {
    return [
        ...array.slice(0, start),
        ...items,
        ...array.slice(start + deleteCount)
    ];
}

/**
 * Clone and remove element from array
 * @param array Source array
 * @param index Index of element to remove
 */
export function remove<T>(array: ReadonlyArray<T>, index: number): ReadonlyArray<T> {
    return array
        .slice(0, index)
        .concat(array.slice(index + 1));
}
