import { IImmutableBackend } from "./backend";

import * as ImmutableJs from "immutable";

export class ImmutableJsBackendAdapter<T> implements IImmutableBackend<T> {
    private data: ImmutableJs.Map<string, any>;

    public init(data: T) {
        this.data = ImmutableJs.fromJS(data);
    }

    public set<U>(path: string[], value: U) {
        this.data = this.data.setIn(path, value);
    }

    public update<U>(path: string[], update: (target: U) => U) {
        this.data = this.data.updateIn(path, update);
    }

    public get(): T {
        return this.data.toJS() as T;
    }
}