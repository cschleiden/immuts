/** @internal*/
function isPlainObject<T>(source: T): boolean {
    return !!source
        && !Array.isArray(source)
        && source === Object(source)
        && source.constructor === Object;
}

/** @internal*/
function isArray<T>(source: T | T[]): source is T[] {
    return !!source
        && Array.isArray(source);
}

export interface IImmutableCloneStrategy {
    clone<T>(source: T): T;
}

export class DefaultCloneStrategy implements IImmutableCloneStrategy {
    public clone<T>(source: T): T {
        return DefaultCloneStrategy._shallowClone<T>(source);
    }

    private static _shallowClone<T>(source: T): T {
        /// #if DEBUG            
        if (!isPlainObject(source) && !isArray(source)) {
            throw new Error("Can only clone plain objects and arrays");
        }
        /// #endif

        if (isArray(source)) {
            return (source as any).slice(0);
        }

        return Object.assign({}, source);
    }
}