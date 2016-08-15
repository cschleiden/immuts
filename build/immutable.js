/// <reference path="../typings/index.d.ts" />
define(["require", "exports"], function (require, exports) {
    "use strict";
    // Polyfill Object.Assign for Internet Explorer
    if (typeof Object["assign"] != 'function') {
        Object["assign"] = function (target) {
            'use strict';
            if (target == null) {
                throw new TypeError('Cannot convert undefined or null to object');
            }
            target = Object(target);
            for (var index = 1; index < arguments.length; index++) {
                var source = arguments[index];
                if (source != null) {
                    for (var key in source) {
                        if (Object.prototype.hasOwnProperty.call(source, key)) {
                            target[key] = source[key];
                        }
                    }
                }
            }
            return target;
        };
    }
    var ImmutableArray = (function () {
        function ImmutableArray(_t) {
            if (_t === void 0) { _t = []; }
            this._t = _t;
        }
        ImmutableArray.prototype.push = function () {
            var t = [];
            for (var _i = 0; _i < arguments.length; _i++) {
                t[_i - 0] = arguments[_i];
            }
            return new ImmutableArray((_a = this._t).concat.apply(_a, t));
            var _a;
        };
        Object.defineProperty(ImmutableArray.prototype, "length", {
            get: function () {
                return this._t.length;
            },
            enumerable: true,
            configurable: true
        });
        ImmutableArray.prototype.toArray = function () {
            return this._t.slice(0);
        };
        ImmutableArray.prototype.get = function (idx) {
            return this._t[idx];
        };
        ImmutableArray.prototype.set = function (idx, t) {
            var clone = this._t.slice(0);
            clone.splice(idx, 1, t);
            return new ImmutableArray(clone);
        };
        return ImmutableArray;
    }());
    exports.ImmutableArray = ImmutableArray;
    var Immutable = (function () {
        function Immutable(init) {
            init();
            if (!Immutable._cloning) {
                Object.freeze(this);
            }
        }
        Immutable.build = function () { };
        Immutable.prototype.set = function (cb) {
            Immutable._cloning = true;
            var clone = this._clone();
            Immutable._cloning = false;
            cb(clone);
            Object.freeze(clone);
            return clone;
        };
        Immutable._cloning = false;
        return Immutable;
    }());
    exports.Immutable = Immutable;
    var Immutable2 = (function () {
        //#endif    
        function Immutable2(t) {
            this.t = t;
        }
        Immutable2.prototype.get = function () {
            return this.t;
        };
        Immutable2._applySelector = function (parent, selector) {
            var result = selector(parent);
            // TODO: Check result is object/array
            // Find name
            var propertyName = Immutable2._findName(parent, result);
            // Clone current node
            var clone = Immutable2._shallowClone(result);
            parent[propertyName] = clone;
            return clone;
        };
        Immutable2._makeProp = function (parent, val) {
            var ip = function (selector) {
                var clone = Immutable2._applySelector(parent, selector);
                return Immutable2._makeProp(clone, function (complete) {
                    if (complete) {
                        complete(clone);
                    }
                });
            };
            ip["val"] = val;
            return ip;
        };
        Immutable2._findName = function (x, val) {
            var name = null;
            for (var _i = 0, _a = Object.keys(x); _i < _a.length; _i++) {
                var key = _a[_i];
                if (x[key] === val) {
                    if (name !== null) {
                        throw new Error("Duplicate key found");
                    }
                    name = key;
                }
            }
            return name;
        };
        Immutable2.prototype.set = function () {
            var _this = this;
            this._pendingSet = true;
            this.t = Immutable2._shallowClone(this.t);
            console.log("clone root");
            return Immutable2._makeProp(this.t, function (complete) {
                if (complete) {
                    complete(_this.t);
                }
                _this._completeSet();
            });
        };
        Immutable2._shallowClone = function (t) {
            return Object.assign({}, t);
        };
        Immutable2.prototype._checkPendingOperation = function () {
            if (this._pendingSet) {
                throw new Error("Uncompleted set operation");
            }
        };
        Immutable2.prototype._completeSet = function () {
            this._pendingSet = false;
        };
        return Immutable2;
    }());
    exports.Immutable2 = Immutable2;
});
