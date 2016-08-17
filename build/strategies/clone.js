define(["require", "exports", "../common"], function (require, exports, common_1) {
    "use strict";
    var DefaultCloneStrategy = (function () {
        function DefaultCloneStrategy() {
        }
        DefaultCloneStrategy.prototype.clone = function (source) {
            return DefaultCloneStrategy._shallowClone(source);
        };
        DefaultCloneStrategy._isPlainObject = function (source) {
            return !!source
                && !Array.isArray(source)
                && source === Object(source)
                && source.constructor === Object;
        };
        DefaultCloneStrategy._shallowClone = function (t) {
            if (common_1.debug) {
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
            return Object.assign({}, t);
        };
        return DefaultCloneStrategy;
    }());
    exports.DefaultCloneStrategy = DefaultCloneStrategy;
});
