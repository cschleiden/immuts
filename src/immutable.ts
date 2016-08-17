/// <reference path="../typings/index.d.ts" />

import { debug } from "./common";
import { IImmutableCloneStrategy, DefaultCloneStrategy } from "./strategies/clone";

export type IImmutableCloneStrategy = IImmutableCloneStrategy;
export class ImmutableArray<T> {
    constructor(private _t: T[] = []) {
    }

    public push(...t: T[]): ImmutableArray<T> {
        return new ImmutableArray<T>(this._t.concat(...t));
    }

    public get length(): number {
        return this._t.length;
    }

    public toArray(): T[] {
        return this._t.slice(0);
    }

    public get(idx: number): T {
        return this._t[idx];
    }

    public set(idx: number, t: T): ImmutableArray<T> {
        let clone = this._t.slice(0);
        clone.splice(idx, 1, t);
        return new ImmutableArray<T>(clone);
    }
}

export interface IImmutableClone<T> {
    clone(): T;
}

export interface IImmutableProperty<T> {
    <U>(x: (t: T) => U): IImmutableProperty<U>;
    val(x: (t: T) => void): void;
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

        // TODO: Check result is object/array

        // Find name
        let propertyName = Immutable._findName(parent, result);

        // Clone current node
        let clone = this.cloneStrategy.clone(result);
        parent[propertyName] = clone;

        return clone;
    }

    private _makeProp<TParent, TValue>(parent: TParent, val: (TValue) => void): IImmutableProperty<TParent> {
        let ip = (selector: (TParent) => TValue): IImmutableProperty<TValue> => {
            let clone = this._applySelector(parent, selector);

            return this._makeProp(
                clone,
                (complete: (TValue) => void) => {
                    if (complete) {
                        complete(clone);
                    }

                    this._completeSet();
                });
        };
        ip["val"] = val;

        return <IImmutableProperty<TParent>>ip;
    }

    private static _findName<X, Y>(x: X, val: Y): string {
        let name: string = null;

        for (let key of Object.keys(x)) {
            if (x[key] === val) {
                if (name !== null) {
                    throw new Error("Duplicate key found");
                }

                name = key;
            }
        }

        return name;
    }

    /**
     * Start setting value on immutable object  
     * @param val Method changing value
     */    
    public set(val: (data: T) => void): T;
    public set(): IImmutableProperty<T>;
    public set(val?: (data: T) => void): T | IImmutableProperty<T> {
        this._pendingSet = true;

        this.data = this.cloneStrategy.clone(this.data);

        if (val) {
            // Set value directly
            val(this.data);

            this._completeSet();

            return this.data;
        } else {
            return this._makeProp(
                this.data,
                (complete: (T) => void) => {
                    if (complete) {
                        complete(this.data);
                    }
                });
        }
    }

    private _checkPendingOperation() {
        if (this._pendingSet) {
            throw new Error("Uncompleted set operation");
        }
    }

    private _completeSet() {
        this._pendingSet = false;

        if (debug) {
            Object.freeze(this.data);
        }
    }
}