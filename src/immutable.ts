/// <reference path="../typings/index.d.ts" />

import { isPlainObject } from "./common";
import { IImmutableCloneStrategy, DefaultCloneStrategy } from "./strategies/clone";

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

    /**
     * Start setting value on wrapped object
     * @param selector Method returning value to set
     */
    public select<TValue>(selector: (t: T) => TValue): IImmutableProperty<TValue, T> {
        /// #if DEBUG
        this._checkPendingOperation();
        /// #endif

        // Clone root
        this.data = this.cloneStrategy.clone(this.data);
        this._pendingSet = true;

        let clone = this._applySelector(this.data, selector);

        return this._makeProp(
            clone,
            (complete: (T) => void) => {
                if (complete) {
                    complete(clone);
                }

                /// #if DEBUG
                this._completeSet();
                /// #endif

                return this.data;
            });
    }

    /**
     * Set value on wrapped object
     * @param set Function to set value
     * @return Wrapped object after setting data
     */
    public set(set: (data: T) => void): T {
        /// #if DEBUG
        this._checkPendingOperation();
        /// #endif

        // Clone root
        this.data = this.cloneStrategy.clone(this.data);

        // Set value directly
        set(this.data);

        return this.data;
    }

    private _applySelector<TParent, TValue>(parent: TParent, selector: (TParent) => TValue): TValue {
        let result = selector(parent);

        // Find name
        let propertyName = Immutable._findName(parent, result);

        // Clone current node
        let clone = this.cloneStrategy.clone(result);
        parent[propertyName] = clone;

        return clone;
    }

    private _makeProp<TParent, TValue>(parent: TParent, set: (t: TValue) => T): IImmutableProperty<TParent, T> {
        let ip = (selector: (TParent) => TValue): IImmutableProperty<TValue, T> => {
            let clone = this._applySelector(parent, selector);

            return this._makeProp(
                clone,
                (complete: (TValue) => void) => {
                    if (complete) {
                        complete(clone);
                    }

                    /// #if DEBUG
                    this._completeSet();
                    /// #endif
                    return this.data;
                });
        };
        (<any>ip).set = set;

        return <IImmutableProperty<TParent, T>>ip;
    }

    private static _findName<X, Y>(x: X, val: Y): string {
        let name: string = null;

        for (let key of Object.keys(x)) {
            if (x[key] === val) {
                if (name !== null) {
                    throw new Error("Duplicate key found");
                }

                name = key;

                /// #if !DEBUG
                // Stop at first matching Object
                break;
                /// #endif
            }
        }

        return name;
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