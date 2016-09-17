import { IImmutableCloneStrategy, DefaultCloneStrategy } from "../strategies/clone";

export interface IImmutableBackend<T> {
    init(data: T);

    set<U>(path: string[], value: U);

    update<U>(path: string[], update: (target: U) => void);

    get(): T;

    beforeSet?();
}

export class DefaultImmutableBackend<T> implements IImmutableBackend<T> {
    private data: T;

    /// #if DEBUG
    private _pendingSet: boolean = false;
    /// #endif

    constructor(private cloneStrategy: IImmutableCloneStrategy = new DefaultCloneStrategy()) {
    }

    public init(data: T) {
        this.data = data;

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

    public set<U>(path: string[], value: U) {
        let tail = this._applyPath(path.slice(0, path.length - 1));
        tail[path[path.length - 1]] = value;

        /// #if DEBUG
        this._completeSet();
        /// #endif
    }

    public update<U>(path: string[], update: (target: U) => U) {
        let tail = this._applyPath(path.slice(0, path.length - 1));

        const lastKey = path[path.length - 1];
        const existingValue = tail[lastKey];
        const newValue = update(existingValue);

        /// #if DEBUG
        if (existingValue === newValue) {
            throw new  Error("Update returned existing value");
        }
        /// #endif

        tail[lastKey] = newValue;

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