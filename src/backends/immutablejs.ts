import { IImmutableBackend } from "./backend";

import * as Immutable from "immutable";

export class ImmutableJsBackendAdapter<T> implements IImmutableBackend<T> {
    private data: Immutable.Map<string, any>;

    public init(data: T) {
        this.data = Immutable.fromJS(data);
    }

    public set<U>(path: string[], value: U) {
        this.data.setIn(path, value);
    }

    public update<U>(path: string[], update: (target: U) => void) {
        this.data.updateIn(path, update);
    }

    public get(): T {
        return this.data.toJS() as T;
    }
}