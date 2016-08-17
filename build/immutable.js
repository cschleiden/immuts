/// <reference path="../typings/index.d.ts" />
define(["require", "exports", "./common", "./strategies/clone"], function (require, exports, common_1, clone_1) {
    "use strict";
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
        //#endif    
        function Immutable(data, cloneStrategy) {
            if (cloneStrategy === void 0) { cloneStrategy = new clone_1.DefaultCloneStrategy(); }
            this.data = data;
            this.cloneStrategy = cloneStrategy;
            this._completeSet();
        }
        Immutable.prototype.get = function () {
            this._checkPendingOperation();
            return this.data;
        };
        Immutable.prototype._applySelector = function (parent, selector) {
            var result = selector(parent);
            // TODO: Check result is object/array
            // Find name
            var propertyName = Immutable._findName(parent, result);
            // Clone current node
            var clone = this.cloneStrategy.clone(result);
            parent[propertyName] = clone;
            return clone;
        };
        Immutable.prototype._makeProp = function (parent, val) {
            var _this = this;
            var ip = function (selector) {
                var clone = _this._applySelector(parent, selector);
                return _this._makeProp(clone, function (complete) {
                    if (complete) {
                        complete(clone);
                    }
                    _this._completeSet();
                    return _this.data;
                });
            };
            ip["val"] = val;
            return ip;
        };
        Immutable._findName = function (x, val) {
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
        Immutable.prototype.set = function (val) {
            var _this = this;
            this._checkPendingOperation();
            // Clone root
            this.data = this.cloneStrategy.clone(this.data);
            if (val) {
                // Set value directly
                val(this.data);
                return this.data;
            }
            else {
                this._pendingSet = true;
                return this._makeProp(this.data, function (complete) {
                    if (complete) {
                        complete(_this.data);
                    }
                    return _this.data;
                });
            }
        };
        Immutable.prototype._checkPendingOperation = function () {
            if (this._pendingSet) {
                throw new Error("Uncompleted set operation");
            }
        };
        Immutable.prototype._completeSet = function () {
            this._pendingSet = false;
            if (common_1.debug) {
                Object.freeze(this.data);
            }
        };
        return Immutable;
    }());
    exports.Immutable = Immutable;
});
