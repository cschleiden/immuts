/// <reference path="../typings/index.d.ts" />

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

export interface IImmutable<T> {
    readonly data: T;

    set<U>(set: (data: T) => U, value: U): IImmutable<T>;

    update<U>(set: (data: T) => U, update: (target: U) => U): IImmutable<T>;
}

namespace DefaultBackend {
    function applyPath<T>(data: T, cloneStrategy: IImmutableCloneStrategy, keyPath: string[]): { root: T; tail: any } {
        let result = cloneStrategy.clone(data);

        let tail: any = result;
        for (let propertyName of keyPath) {
            let propertyValueClone = cloneStrategy.clone(tail[propertyName]);
            tail[propertyName] = propertyValueClone;
            tail = propertyValueClone;
        }

        return { root: result, tail: tail };
    }

    export function set<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], value: U): T {
        let { root, tail } = applyPath(data, cloneStrategy, path.slice(0, path.length - 1));
        tail[path[path.length - 1]] = value;

        return root;
    }

    export function update<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], update: (target: U) => U): T {
        let { root, tail } = applyPath(data, cloneStrategy, path.slice(0, path.length - 1));

        const lastKey = path[path.length - 1];
        const existingValue = tail[lastKey];
        const newValue = update(existingValue);

        /// #if DEBUG
        if (existingValue === newValue) {
            throw new Error("Update returned existing value");
        }
        /// #endif

        tail[lastKey] = newValue;

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

        set: <U>(set: (data: T) => U, value: U): IImmutable<T> => {
            set(proxy.get());

            let result = DefaultBackend.set(data, cloneStrategy, proxy.propertiesAccessed, value);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        },

        update: <U>(set: (data: T) => U, update: (target: U) => U): IImmutable<T> => {
            set(proxy.get());

            let result = DefaultBackend.update(data, cloneStrategy, proxy.propertiesAccessed, update);

            return makeImmutableImpl<T>(result, cloneStrategy, proxy);
        }
    };
}
