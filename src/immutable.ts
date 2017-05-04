import { IImmutableCloneStrategy, DefaultCloneStrategy } from "./strategies/clone";
import { ImmutableProxy } from "./proxy";

// Polyfill Object.Assign for Internet Explorer
if (typeof Object["assign"] != 'function') {
    Object["assign"] = function (target) {
        'use strict';
        if (target == null) {
            throw new TypeError('Cannot convert undefined or null to object');
        }

        target = Object(target);
        for (var index = 1; index < arguments.length; index++) {
            var source = arguments[index];
            if (source != null) {
                for (var key in source) {
                    if (Object.prototype.hasOwnProperty.call(source, key)) {
                        target[key] = source[key];
                    }
                }
            }
        }
        return target;
    };
}

export type PathSelector<T, U> = (data: T) => U;

export interface IImmutable<T> {
    /** 
     * Get data as plain JS object. 
     */
    readonly data: Readonly<T>;

    /**
     * Return data as plain JS object.
     * Alias for data getter
     */
    toJS(): Readonly<T>;

    /**
     * Updates a value at the given path
     * @param select Path selector
     * @param value New value to set at path
     */
    set<U>(select: PathSelector<T, U>, value: U): IImmutable<T>;

    /**
     * Updates the value at the given path.
     * @param select Path selector
     * @param update Method to update value. Will be passed the current value, must return a new value.
     */
    update<U>(select: PathSelector<T, U>, update: (target: U) => U): IImmutable<T>;

    /**
     * Merge the given partial object
     * @param select Path selector
     * @param value Partial value to set
     */
    merge<U>(select: PathSelector<T, U>, value: Partial<U>): IImmutable<T>;

    /**
     * Array functions on immutable object
     */
    array: IImmutableArray<T>;
}

export interface IImmutableArray<T> {
    /**
     * Inserts the given element at the given index
     * 
     * @param select Path selector
     * @param item Item to insert 
     * @param index Optional index, if not given element will be inserted at the end
     */
    insert<U>(select: PathSelector<T, U[]>, element: U, index?: number): IImmutable<T>;

    /**
     * Removes an element at the given index
     * 
     * @param select Path selector
     * @param index Index at which to remove item
     */
    remove<U>(select: PathSelector<T, U[]>, index: number): IImmutable<T>;
}

namespace DefaultBackend {
    function applyPath<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, keyPath: string[], skipLast: boolean): { root: T; tail: U, lastProperty?: string } {
        // Clone root
        let root = cloneStrategy.clone(data);

        let lastProperty: string = null;
        if (skipLast && keyPath.length > 0) {
            lastProperty = keyPath[keyPath.length - 1];
            keyPath = keyPath.slice(0, keyPath.length - 1);
        }

        // Follow path and clone objects
        let tail: any = root;
        for (let propertyName of keyPath) {
            let propertyValueClone = cloneStrategy.clone(tail[propertyName]);
            tail[propertyName] = propertyValueClone;
            tail = propertyValueClone;
        }

        return { root, tail, lastProperty };
    }

    export function set<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], value: U): T {
        const { root, tail, lastProperty } = applyPath(data, cloneStrategy, path, true);

        if (lastProperty) {
            tail[lastProperty] = value;
        } else {
            // Root
            (<any>Object).assign(root, value);
        }

        return root;
    }

    export function merge<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], value: Partial<U>): T {
        let { root, tail } = applyPath(data, cloneStrategy, path, false);

        (<any>Object).assign(tail, value);

        return root;
    }

    export function update<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], update: (target: U) => U): T {
        const { root, tail, lastProperty } = applyPath(data, cloneStrategy, path, true);

        const existingValue = lastProperty ? tail[lastProperty] : root;
        const updatedValue = update(existingValue);

        if (existingValue === updatedValue) {
            throw new Error("Update must return a new value");
        }

        if (lastProperty) {
            tail[lastProperty] = updatedValue;
        } else {
            // Replace root
            (<any>Object).assign(root, updatedValue);
        }

        return root;
    }

    export namespace array {
        export function insert<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], item: U, index?: number): T {
            const { root, tail, lastProperty } = applyPath<T, U[]>(data, cloneStrategy, path, false);

            if (!Array.isArray(tail)) {
                throw new Error("Remove needs to be called on an array.");
            }

            if (index === undefined) {
                tail.push(item);
            } else {
                tail.splice(index, 0, item);
            }

            return root;
        }

        export function remove<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], index: number): T {
            const { root, tail, lastProperty } = applyPath(data, cloneStrategy, path, false);

            if (!Array.isArray(tail)) {
                throw new Error("Remove needs to be called on an array.");
            }

            tail.splice(index, 1);

            return root;
        }
    };
}

export function makeImmutable<T>(data: T, cloneStrategy: IImmutableCloneStrategy = new DefaultCloneStrategy()): IImmutable<T> {
    let proxy = new ImmutableProxy<T>(data, (key: string, value: any) => {
        throw new Error("You cannot set");
    });

    return makeImmutableImpl(data, cloneStrategy, proxy);
}

export interface IImmutableOptions {
    doNotFreezeInput?: boolean;
}

function makeImmutableImpl<T>(
    data: T,
    cloneStrategy: IImmutableCloneStrategy,
    proxy: ImmutableProxy<T>,
    options?: IImmutableOptions): IImmutable<T> {

    if (!options || !options.doNotFreezeInput) {
        Object.freeze(data);
    }

    return <IImmutable<T>>{
        get data(): Readonly<T> {
            return data;
        },

        toJS(): Readonly<T> {
            return this.data;
        },

        set: <U>(select: PathSelector<T, U>, value: U): IImmutable<T> => {
            select(proxy.get());

            let result = DefaultBackend.set(data, cloneStrategy, proxy.propertiesAccessed, value);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        },

        merge: <U>(select: PathSelector<T, U>, value: Partial<U>): IImmutable<T> => {
            select(proxy.get());

            let result = DefaultBackend.merge(data, cloneStrategy, proxy.propertiesAccessed, value);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        },

        update: <U>(select: PathSelector<T, U>, update: (target: U) => U): IImmutable<T> => {
            select(proxy.get());

            let result = DefaultBackend.update(data, cloneStrategy, proxy.propertiesAccessed, update);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        },

        array: {
            insert: <U>(select: PathSelector<T, U[]>, element: U, index?: number) => {
                select(proxy.get());

                let result = DefaultBackend.array.insert<T, U>(data, cloneStrategy, proxy.propertiesAccessed, element, index);

                return makeImmutableImpl<T>(result, cloneStrategy, proxy);
            },

            remove: <U>(select: PathSelector<T, U[]>, index: number) => {
                select(proxy.get());

                let result = DefaultBackend.array.remove<T, U>(data, cloneStrategy, proxy.propertiesAccessed, index);

                return makeImmutableImpl<T>(result, cloneStrategy, proxy);
            }
        } as IImmutableArray<T>
    };
}
