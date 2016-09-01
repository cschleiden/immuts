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