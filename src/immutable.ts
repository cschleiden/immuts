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

// Courtesy of https://github.com/Microsoft/TypeScript/issues/15012#issuecomment-346499713
type NonNullable<T> = T & {};
type Purify<T extends string> = {[P in T]: T; }[T];
type Required<T> = {
    [P in Purify<keyof T>]: NonNullable<T[P]>;
};

type DeepReadonly<T> = {
    readonly [P in keyof T]: DeepReadonly<T[P]>;
}

export interface IImmutableUpdate<T> {
    __set(value: T): IImmutable<T>;
    __set<U>(select: PathSelector<T, U>, update: (target: U) => U): IImmutable<T>;
    __set<U>(select: PathSelector<T, U>, value: U): IImmutable<T>;
}

export type IImmutable<T> = Readonly<T> & IImmutableUpdate<T>;

namespace DefaultBackend {
    function applyPath<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[]): { root: T; tail: U; lastProperty?: string } {
        // Clone root
        let root = cloneStrategy.clone(data);

        let lastProperty: string = null;
        if (path.length > 0) {
            lastProperty = path[path.length - 1];
            path = path.slice(0, path.length - 1);
        }

        // Follow path and clone objects
        let tail: any = root;
        for (let propertyName of path) {
            let propertyValueClone = cloneStrategy.clone(tail[propertyName]);
            tail[propertyName] = propertyValueClone;
            tail = propertyValueClone;
        }

        return { root, tail, lastProperty };
    }

    export function set<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], value: U): T {
        const { root, tail, lastProperty } = applyPath(data, cloneStrategy, path);

        if (lastProperty) {
            tail[lastProperty] = value;
        } else {
            // Root
            (<any>Object).assign(root, value);
        }

        return root;
    }

    export function update<T, U>(data: T, cloneStrategy: IImmutableCloneStrategy, path: string[], update: (target: U) => U): T {
        const { root, tail, lastProperty } = applyPath(data, cloneStrategy, path);

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
}

export interface IImmutableOptions {
    doNotFreezeInput?: boolean;
}

export function makeImmutable<T>(data: T, options?: IImmutableOptions): IImmutable<T> {
    return makeImmutableImpl(data);
}

const cloneStrategy = new DefaultCloneStrategy();

function makeImmutableImpl<T>(
    data: T,
    options?: IImmutableOptions): IImmutable<T> {

    if (!options || !options.doNotFreezeInput) {
        Object.freeze(data);
    }

    const proxy = new ImmutableProxy(data);
    const __set = <U>(select: T | PathSelector<T, U>, update?: U | ((target: U) => U)) => {
        if (typeof select !== "function") {
            // Replace complete object
            return makeImmutableImpl<T>(select, options);
        }

        select(proxy.get());

        let result: T;
        if (typeof update === "function") {
            result = DefaultBackend.update(data, cloneStrategy, proxy.path, update);
        } else {
            result = DefaultBackend.set(data, cloneStrategy, proxy.path, update)
        }

        return makeImmutableImpl<T>(result, options);
    };

    return Object.assign(
        {},
        data as any,
        {
            __set
        });
}