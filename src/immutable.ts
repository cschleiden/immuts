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

export type Partial<T> = T;

export interface IImmutable<T> {
    /** 
     * Get data as plain JS object. 
     */
    readonly data: T;

    /**
     * Return data as plain JS object.
     * Alias for data getter
     */
    toJS(): T;

    /**
     * Updates a value at the given path
     * @param select Path to update
     * @param value New value to set
     */
    set<U>(select: (data: T) => U, value: U): IImmutable<T>;

    update<U>(select: (data: T) => U, update: (target: U) => U): IImmutable<T>;

    merge<U>(select: (data: T) => U, value: Partial<U>): IImmutable<T>;

    remove<U>(select: (data: T) => U): IImmutable<T>;

    updateAt<U>(select: (data: T) => U[], index: number, update: (target: U) => U): IImmutable<T>;
}

namespace DefaultBackend {
    function applyPath<T>(data: T, cloneStrategy: IImmutableCloneStrategy, keyPath: string[], skipLast: boolean): { root: T; tail: any, lastProperty?: string } {
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

        /// #if DEBUG
        if (existingValue === updatedValue) {
            throw new Error("Update must return a new value");
        }
        /// #endif

        if (lastProperty) {            
            tail[lastProperty] = updatedValue;
        } else {
            // Replace root
            (<any>Object).assign(root, updatedValue);
        }

        return root;
    }

    export function updateAt<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], index: number, update: (target: U) => U): T {
        const { root } = applyPath(data, cloneStrategy, path, false);

        return root;
    }

    export function remove<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[]): T {
        const { root, tail, lastProperty } = applyPath(data, cloneStrategy, path, true);

        if (Array.isArray(tail)) {
            tail.splice(parseInt(lastProperty, 10), 1);
        } else {
            delete tail[lastProperty];
        }

        return root;
    }
}

export function makeImmutable<T>(data: T, cloneStrategy: IImmutableCloneStrategy = new DefaultCloneStrategy()): IImmutable<T> {
    let proxy = new ImmutableProxy<T>(data, (key: string, value: any) => {
        throw new Error("You cannot set");
    });

    return makeImmutableImpl(data, cloneStrategy, proxy);
}

function makeImmutableImpl<T>(
    data: T,
    cloneStrategy: IImmutableCloneStrategy,
    proxy: ImmutableProxy<T>): IImmutable<T> {

    /// #if DEBUG
    Object.freeze(data);
    /// #endif

    return <IImmutable<T>>{
        get data(): T {
            return data;
        },

        toJS(): T {
            return this.data;
        },

        set: <U>(select: (data: T) => U, value: U): IImmutable<T> => {
            select(proxy.get());

            let result = DefaultBackend.set(data, cloneStrategy, proxy.propertiesAccessed, value);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        },

        merge: <U>(select: (data: T) => U, value: Partial<U>): IImmutable<T> => {
            select(proxy.get());

            let result = DefaultBackend.merge(data, cloneStrategy, proxy.propertiesAccessed, value);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        },

        update: <U>(set: (data: T) => U, update: (target: U) => U): IImmutable<T> => {
            set(proxy.get());

            let result = DefaultBackend.update(data, cloneStrategy, proxy.propertiesAccessed, update);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        },

        remove: <U>(set: (data: T) => U): IImmutable<T> => {
            set(proxy.get());

            let result = DefaultBackend.remove(data, cloneStrategy, proxy.propertiesAccessed);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        }
    };
}
