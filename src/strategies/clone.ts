import { debug } from "../common";

export interface IImmutableCloneStrategy {
    clone<T>(source: T): T;
}

export class DefaultCloneStrategy implements IImmutableCloneStrategy {
        public clone<T>(source: T): T {
            return DefaultCloneStrategy._shallowClone(source);
        }

        private static _isPlainObject<T>(source: T) {
            return !!source
                && !Array.isArray(source)
                && source === Object(source)
                && source.constructor === Object;
        }

        private static _shallowClone<T>(t: T): T {
            if (debug) {
                if (!DefaultCloneStrategy._isPlainObject(t)) {
                    throw new Error("Can only clone plain objects");
                }
            }

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

            return (<any>Object).assign({}, t);
        }
    }