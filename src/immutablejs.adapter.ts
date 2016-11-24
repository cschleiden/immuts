import { IImmutable, Partial } from "./immutable";
import { ImmutableProxy } from "./proxy";

import * as ImmutableJs from "immutable";

function makeImmutableJsImpl<T, K, V>(data: ImmutableJs.Map<K, V>, proxy: ImmutableProxy<T>): IImmutable<T> {
    return <IImmutable<T>>{
        get data(): T {
            return data.toJS();
        },

        toJS(): T {
            return data.toJS();
        },

        set: <U>(select: (data: T) => U, value: U): IImmutable<T> => {
            select(proxy.get());

            let result = data.setIn(proxy.propertiesAccessed, value);

            return makeImmutableJsImpl<T, K, V>(result, proxy);
        },

        update: <U>(select: (data: T) => U, update: (target: U) => U): IImmutable<T> => {
            select(proxy.get());

            let result = data.updateIn(proxy.propertiesAccessed, update);

            return makeImmutableJsImpl<T, K, V>(result, proxy);
        },


        merge: <U>(select: (data: T) => U, value: Partial<U>): IImmutable<T> => {
            select(proxy.get());

            let result = data.mergeDeepIn(proxy.propertiesAccessed, value as any);
            
            return makeImmutableJsImpl<T, K, V>(result as any, proxy);
        }
    };
} 

export function makeImmutableJs<T>(data: T): IImmutable<T> {
    let proxy = new ImmutableProxy<T>(data, (key: string, value: any) => {
        throw new Error("You cannot set");
    });

    return makeImmutableJsImpl(ImmutableJs.fromJS(data), proxy);
}