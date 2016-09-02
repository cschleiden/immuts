/// <reference path="../typings/index.d.ts" />

import { isPlainObject } from "./common";
import { IImmutableCloneStrategy, DefaultCloneStrategy } from "./strategies/clone";
import { ImmutableProxy } from "./proxy";

export interface IImmutableBackend<T> {
    set<U>(path: string[], key: string, value: U);

    update<U>(path: string[], update: (target: U) => void);

    get(): T;

    beforeSet?();
}

export class DefaultImmutableBackend<T> implements IImmutableBackend<T> {
    /// #if DEBUG
    private _pendingSet: boolean = false;
    /// #endif

    constructor(private data: T, private cloneStrategy: IImmutableCloneStrategy = new DefaultCloneStrategy()) {
        /// #if DEBUG
        this._completeSet();
        /// #endif
    }

    /// #if DEBUG
    public beforeSet() {
        this._checkPendingOperation();
    
        this._pendingSet = true;
    }
    /// #endif

    public set<U>(path: string[], key: string, value: U) {
        let tail = this._applyPath(path);
        tail[key] = value;

        /// #if DEBUG
        this._completeSet();
        /// #endif
    }

    public update<U>(path: string[], update: (target: U) => void) {
        let tail = this._applyPath(path);

        update(tail);

        /// #if DEBUG
        this._completeSet();
        /// #endif

    }

    public get(): T {
        /// #if DEBUG
        this._checkPendingOperation();
        /// #endif

        return this.data;
    }

    private _applyPath(keyPath: string[]): any {
        // Clone root
        this.data = this.cloneStrategy.clone(this.data);

        let tail: any = this.data;
        for (let propertyName of keyPath) {
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

///export class ImmutableJsBackendAdapter<T> implements IImmutableBackend<T> {
///
///}

export class Immutable<T> {
    /**
     * Create new immutable object by wrapping data
     * @param data Object to wrap
     * @param backend Optional backend
     */
    constructor(
        data: T,
        private backend: IImmutableBackend<T> = new DefaultImmutableBackend<T>(data)) {
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