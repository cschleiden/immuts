/// <reference path="../typings/index.d.ts" />

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