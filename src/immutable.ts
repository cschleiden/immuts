/// <reference path="../typings/index.d.ts" />

import { isPlainObject } from "./common";
import { IImmutableCloneStrategy, DefaultCloneStrategy } from "./strategies/clone";
import { IImmutableBackend, DefaultImmutableBackend } from "./backends/backend";
import { ImmutableProxy } from "./proxy";


export class Immutable<T> {
    /**
     * Create new immutable object by wrapping data
     * @param data Object to wrap
     * @param backend Optional backend
     */
    constructor(
        data: T,
        private backend: IImmutableBackend<T> = new DefaultImmutableBackend<T>()) {
        this.backend.init(data);
    }

    /** Get the current value of the wrapped object */
    public get(): T {
        return this.backend.get();
    }

    public set(set: (data: T) => void): T {
        let proxy = new ImmutableProxy<T>(this.backend.get(), (key: string, value: any) => {
            this.backend.set(proxy.propertiesAccessed, key, value);
        });

        this._beforeSet();

        set(proxy.get());

        return this.backend.get();
    }

    public update<U>(set: (data: T) => U, update: (target: U) => void) {
        let proxy = new ImmutableProxy<T>(this.backend.get(), (name: string, value: any) => { });

        this._beforeSet();

        set(proxy.get());

        this.backend.update(proxy.propertiesAccessed, update);

        return this.backend.get();
    }

    private _beforeSet() {
        if (this.backend.beforeSet) {
            this.backend.beforeSet();
        }
    }
}