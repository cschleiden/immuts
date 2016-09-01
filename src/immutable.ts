/// <reference path="../typings/index.d.ts" />

import { isPlainObject } from "./common";
import { IImmutableCloneStrategy, DefaultCloneStrategy } from "./strategies/clone";

export interface IImmutableClone<T> {
    clone(): T;
}

export interface IImmutableProperty<T, TParent> {
    <U>(x: (t: T) => U): IImmutableProperty<U, TParent>;
    set(x: (t: T) => void): TParent;
}

export class Immutable<T> {
    //#if DEBUG
    private _pendingSet: boolean;
    //#endif

    constructor(
        private data: T,
        private cloneStrategy: IImmutableCloneStrategy = new DefaultCloneStrategy()) {
        this._completeSet();
    }

    public get(): T {
        this._checkPendingOperation();

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

                    this._completeSet();
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

    /**
     * Start setting value on immutable object
     * @param selector Method returning value to set
     */
    public select<TValue>(selector: (t: T) => TValue): IImmutableProperty<TValue, T> {
        this._checkPendingOperation();

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

                this._completeSet();
                return this.data;
            });
    }

    /**
     * Set value
     * @param set
     */
    public set(set: (data: T) => void): T {
        this._checkPendingOperation();

        // Clone root
        this.data = this.cloneStrategy.clone(this.data);

        // Set value directly
        set(this.data);

        return this.data;
    }

    private _checkPendingOperation() {
        if (this._pendingSet) {
            throw new Error("Uncompleted set operation");
        }
    }

    private _completeSet() {
        this._pendingSet = false;

        /// #if DEBUG
        // Ensure object cannot be modified
        Object.freeze(this.data);
        /// #endif
    }
}