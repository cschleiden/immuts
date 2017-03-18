/** @internal*/
function isPlainObject<T>(source: T): boolean {
    return !!source
        && !Array.isArray(source)
        && source === Object(source)
        && source.constructor === Object;
}

function isArray<T>(source: T | T[]) : source is T[] {
    return !!source 
        && Array.isArray(source);
}

export interface IImmutableCloneStrategy {
    clone<T>(source: T): T;
}

export class DefaultCloneStrategy implements IImmutableCloneStrategy {
    public clone<T>(source: T | T[]): T | T[] {
        return DefaultCloneStrategy._shallowClone(source);
    }

    private static _shallowClone<T>(source: T | T[]): T | T[] {
        /// #if DEBUG            
        if (!isPlainObject(source) && !isArray(source)) {
            throw new Error("Can only clone plain objects and arrays");
        }
        /// #endif

        if (isArray(source)) {
            return source.slice(0);
        }

        return (<any>Object).assign({}, source);
    }
}