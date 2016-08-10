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

    public get(idx: number): T {
        return this._t[idx];
    }
}

export class Immutable<T, TC> {
    private _values: T;
    private _locked: boolean = true;
    private _modified: boolean = false;

    constructor(values: T) {
        this._values = <T>{};

        for (let key in values) {
            this._values[key] = values[key];
            
            Object.defineProperty(this, key, {
                enumerable: true,
                get: () => {
                    return this._values[key];
                },
                set: (val: any) => {
                    if (this._locked) {
                        throw new Error("Cannot mutate");
                    }

                    if (this._values[key] !== val) {
                        this._values[key] = val;
                        this._modified = true;
                    }
                }
            });
        }
    }

    public set(x: (t: TC) => any): TC {
        let clone = new Immutable<T, TC>(this._values);
        clone._locked = false;
        let r = x(<any>clone);
        clone._locked = true;
        if (clone._modified || Boolean(r)) {
            clone._modified = false;
            return <any>clone;
        }

        return <any>this;
    }
}