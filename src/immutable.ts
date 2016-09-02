/// <reference path="../typings/index.d.ts" />

import { isPlainObject } from "./common";
import { IImmutableCloneStrategy, DefaultCloneStrategy } from "./strategies/clone";
import { ImmutableProxy } from "./proxy";

export interface IImmutableClone<T> {
    clone(): T;
}

export interface IImmutableProperty<T, TParent> {
    /** Select child object */
    <U>(x: (t: T) => U): IImmutableProperty<U, TParent>;

    /** 
     * Set value
     * @param x Function to set value
     * @return Updated instance
     */
    set(x: (t: T) => void): TParent;
}
/*
function buildProxy<T>(x: T, get: Function, set: Function) {
    var proxy = {};

    for (var property in x) {
        if (x.hasOwnProperty(property)) {
            Object.defineProperty(proxy, property, {
                get: () => {
                    get(property);
                },
                set: () => {
                    set(property);
                }
            })
        }
    }
}
*/


export class Immutable<T> {
    //#if DEBUG
    private _pendingSet: boolean;
    //#endif

    /**
     * Create new immutable object by wrapping data
     * @param data Object to wrap
     * @param cloneStrategy Optional clone strategy to use when cloning objects
     */
    constructor(
        private data: T,
        private cloneStrategy: IImmutableCloneStrategy = new DefaultCloneStrategy()) {
        /// #if DEBUG
        this._completeSet();
        /// #endif
    }

    /** Get the current value of the wrapped object */
    public get(): T {
        /// #if DEBUG
        this._checkPendingOperation();
        /// #endif

        return this.data;
    }

    public set(set: (data: T) => void): T {
        /// #if DEBUG
        this._checkPendingOperation();
        /// #endif

        let proxy = new ImmutableProxy<T>(this.data, (name: string, value: any) => {
            // Clone objects in path
            let tail = this._applyPath(proxy.propertiesAccessed);

            tail[name] = value;

            /// #if DEBUG
            this._completeSet();
            /// #endif
        });

        set(proxy.get());

        return this.data;
    }

    public update<U>(set: (data: T) => U, update: (target: U) => void) {
        /// #if DEBUG
        this._checkPendingOperation();
        /// #endif

        let proxy = new ImmutableProxy<T>(this.data, (name: string, value: any) => { });

        set(proxy.get());

        let tail = this._applyPath(proxy.propertiesAccessed);

        update(tail);

        /// #if DEBUG
        this._completeSet();
        /// #endif

        return this.data;
    }

    private _applyPath<U>(keyPath: string[]): any {
        // Clone root
        this.data = this.cloneStrategy.clone(this.data);

        let tail = this.data;
        for (let propertyName of keyPath) {
            console.log(propertyName);
            let propertyValueClone = this.cloneStrategy.clone(tail[propertyName]);
            tail[propertyName] = propertyValueClone;
            tail = propertyValueClone;
        }

        return tail;
    }

    /// #if DEBUG
    private _checkPendingOperation() {
        if (this._pendingSet) {
            throw new Error("Uncompleted set operation");
        }
    }

    private _completeSet() {
        this._pendingSet = false;

        // Ensure object cannot be modified
        Object.freeze(this.data);
    }
    /// #endif
}