/// <reference path="../typings/index.d.ts" />

import { IImmutableCloneStrategy, DefaultCloneStrategy } from "./strategies/clone";
import { IImmutableBackend, DefaultImmutableBackend } from "./backends/backend";
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
    data: T;

    set<U>(set: (data: T) => U, value: U): IImmutable<T>;

    update<U>(set: (data: T) => U, update: (target: U) => U): IImmutable<T>;
} 

class Immutable<T> {
    /**
     * Create new immutable object by wrapping data
     * @param data Object to wrap
     * @param backend Optional backend
     */
    constructor(
        private _backend: IImmutableBackend<T>,
        private _proxy?: ImmutableProxy<T>) {

        this._createProxy();  
    }

    /** Get the current value of the wrapped object */
    get data(): T {
        return this._backend.get();
    }

    public set<U>(set: (data: T) => U, value: U): IImmutable<T> {
        this._beforeSet();
        set(this._proxy.get());

        this._backend.set(this._proxy.propertiesAccessed, value);

        return new Immutable<T>(this._backend, this._proxy);
    }

    public update<U>(set: (data: T) => U, update: (target: U) => U): IImmutable<T> {
        this._beforeSet();

        set(this._proxy.get());

        this._backend.update(this._proxy.propertiesAccessed, update);

        return new Immutable<T>(this._backend, this._proxy);
    }

    private _beforeSet() {
        if (this._backend.beforeSet) {
            this._backend.beforeSet();
        }
    }

    private _createProxy(): void {
        if (!this._proxy) {
            this._proxy = new ImmutableProxy<T>(this._backend.get(), (key: string, value: any) => {
                throw new Error("You cannot set");
            });
        }
    }
}


export function makeImmutable<T>(data: T, backend: IImmutableBackend<T> = new DefaultImmutableBackend<T>()): IImmutable<T> {
    backend.init(data);
    return new Immutable<T>(backend);
}