/// <reference path="../typings/index.d.ts" />

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

interface IImmutable<T> {
    set(cb: (x: IImmutable<T>) => void): IImmutable<T>;
}

export abstract class Immutable<T extends Immutable<T>> {
    private static _cloning: boolean = false;

    constructor(init: () => void) {
        init();

        if (!Immutable._cloning) {
            Object.freeze(this);
        }
    }

    public static build() { }

    public set(cb: (x: T) => void): T {
        Immutable._cloning = true;
        let clone = this._clone();
        Immutable._cloning = false;

        cb(clone);
        Object.freeze(clone);
        return clone;
    }

    protected abstract _clone(): T;
}

export interface IA {
    b: IB;
    b2: IB;
    foo: string;
}

export interface IB {
    c: IC;
    ar: number[];
}

export interface IC {
    name: string;
    id: number;
}

export interface IImmutableProperty<T> {
    <U>(x: (t: T) => U): IImmutableProperty<U>;
    val(x: (t: T) => void): void;
}

export class Immutable2<T> {
    //#if DEBUG
    private _pendingSet: boolean;
    //#endif    

    constructor(private t: T) {
    }

    public get(): T {
        return this.t;
    }

    private static _applySelector<TParent, TValue>(parent: TParent, selector: (TParent) => TValue): TValue {
        let result = selector(parent);

        // TODO: Check result is object/array

        // Find name
        let propertyName = Immutable2._findName(parent, result);

        // Clone current node
        let clone = Immutable2._shallowClone(result);
        parent[propertyName] = clone;

        return clone;
    }

    private static _makeProp<TParent, TValue>(parent: TParent, val: (TValue) => void): IImmutableProperty<TParent> {
        let ip = (selector: (TParent) => TValue): IImmutableProperty<TValue> => {
            let clone = Immutable2._applySelector(parent, selector);

            return Immutable2._makeProp(clone, (complete: (TValue) => void) => {
                if (complete) {
                    complete(clone);
                }
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

    public set(): IImmutableProperty<T> {
        this._pendingSet = true;

        this.t = Immutable2._shallowClone(this.t);
        console.log("clone root");

        return Immutable2._makeProp(this.t, (complete: (TValue) => void) => {
            if (complete) {
                complete(this.t);
            }

            this._completeSet();
        });
    }

    private static _shallowClone<T>(t: T): T {
        return (<any>Object).assign({}, t);
    }

    private _checkPendingOperation() {
        if (this._pendingSet) {
            throw new Error("Uncompleted set operation");
        }
    }

    private _completeSet() {
        this._pendingSet = false;
    }
}