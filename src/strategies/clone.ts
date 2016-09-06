import "../common";

/** @internal*/
function isPlainObject<T>(source: T): boolean {
    return !!source
        && !Array.isArray(source)
        && source === Object(source)
        && source.constructor === Object;
}

function isArray<T>(source: T): boolean {
    return !!source 
        && Array.isArray(source);
}

export interface IImmutableCloneStrategy {
    clone<T>(source: T): T;
}

export class DefaultCloneStrategy implements IImmutableCloneStrategy {
    public clone<T>(source: T): T {
        return DefaultCloneStrategy._shallowClone(source);
    }

    private static _shallowClone<T>(source: T): T {
        /// #if DEBUG            
        if (!isPlainObject(source) && !isArray(source)) {
            throw new Error("Can only clone plain objects and arrays");
        }
        /// #endif

        /*
                let clone: T = <T>{};
        
                for (let key of Object.keys(t)) {
                    if (typeof key === "string"
                        || typeof key === "number") {
                        clone[key] = t[key];
                    } else {
                        if (t[key].clone) {
                            clone[key] = t[key].clone();
                        } else {
                            clone[key] = t[key];
                        }
                    }            
                }
                
                return clone;
        */
        
        if (isArray(source)) {
            return (source as any).slice(0);
        }

        return (<any>Object).assign({}, source);
    }
}